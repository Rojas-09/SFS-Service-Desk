/**
 * Suite de pruebas automatizadas de seguridad (Requirement 8).
 * Ejecutable con: npx tsx scripts/test-seguridad.ts
 *
 * Comprueba:
 * 1. Que producción no arranca sin AUTH_SECRET (o con < 32 caracteres).
 * 2. 401 sin cookie en rutas protegidas.
 * 3. 403 de un agente en rutas de admin / cambio de rol.
 * 4. 403 con code: 'MUST_CHANGE_PASSWORD' si mustChangePassword = true.
 * 5. Cliente solo con tickets de su empresa y sin mensajes internos.
 * 6. 429 tras 5 fallos con cabecera Retry-After y mismo mensaje genérico.
 */

process.env.TEST_MODE = '1';

import { app } from '../server';
import { getSecret, resetLoginRateLimits, AUTH_COOKIE_NAME } from '../lib/auth/index';
import type { Server } from 'http';

interface TestResult {
  name: string;
  passed: boolean;
  details?: string;
}

const results: TestResult[] = [];

function assert(condition: boolean, name: string, details?: string) {
  if (condition) {
    results.push({ name, passed: true, details });
    console.log(`  \x1b[32m✔\x1b[0m ${name}`);
  } else {
    results.push({ name, passed: false, details });
    console.error(`  \x1b[31m✘\x1b[0m ${name}: ${details || 'Fallo de aserción'}`);
  }
}

async function runSecurityTests() {
  console.log('\n\x1b[1m\x1b[34m=====================================================\x1b[0m');
  console.log('\x1b[1m\x1b[34m    SFS SERVICE DESK - AUDITORÍA DE SEGURIDAD (K1-K9)\x1b[0m');
  console.log('\x1b[1m\x1b[34m=====================================================\x1b[0m\n');

  // --------------------------------------------------------------------------
  // TEST 1: Producción no arranca sin AUTH_SECRET o con < 32 caracteres (K5)
  // --------------------------------------------------------------------------
  console.log('\x1b[33m[Test 1/6]\x1b[0m Validación de AUTH_SECRET en entorno de producción...');
  const originalEnv = process.env.NODE_ENV;
  const originalSecret = process.env.AUTH_SECRET;

  try {
    process.env.NODE_ENV = 'production';
    delete process.env.AUTH_SECRET;

    let threwWithoutSecret = false;
    try {
      getSecret();
    } catch (err: any) {
      threwWithoutSecret = err.message.includes('CRITICAL_CONFIG_ERROR');
    }
    assert(threwWithoutSecret, 'Producción lanza error crítico si AUTH_SECRET no está definido');

    process.env.AUTH_SECRET = 'clave_corta_insegura_123';
    let threwWithShortSecret = false;
    try {
      getSecret();
    } catch (err: any) {
      threwWithShortSecret = err.message.includes('CRITICAL_CONFIG_ERROR');
    }
    assert(threwWithShortSecret, 'Producción lanza error crítico si AUTH_SECRET tiene menos de 32 caracteres');
  } finally {
    process.env.NODE_ENV = originalEnv;
    if (originalSecret) process.env.AUTH_SECRET = originalSecret;
    else delete process.env.AUTH_SECRET;
  }

  // --------------------------------------------------------------------------
  // INICIAR SERVIDOR EN PUERTO DE PRUEBA
  // --------------------------------------------------------------------------
  const TEST_PORT = 3889;
  const BASE_URL = `http://127.0.0.1:${TEST_PORT}`;

  const server: Server = await new Promise((resolve) => {
    const s = app.listen(TEST_PORT, '127.0.0.1', () => resolve(s));
  });

  try {
    // --------------------------------------------------------------------------
    // TEST 2: 401 sin cookie en rutas protegidas (K3)
    // --------------------------------------------------------------------------
    console.log('\n\x1b[33m[Test 2/6]\x1b[0m Petición sin cookie en /api/tickets...');
    const resNoCookie = await fetch(`${BASE_URL}/api/tickets`);
    const dataNoCookie = await resNoCookie.json();

    assert(
      resNoCookie.status === 401 && dataNoCookie.code === 'UNAUTHORIZED',
      'Responde HTTP 401 con código UNAUTHORIZED cuando no hay cookie de sesión',
      `Status recibido: ${resNoCookie.status}`
    );

    // --------------------------------------------------------------------------
    // TEST 3: 403 de un agente en rutas de admin (K3 & K7)
    // --------------------------------------------------------------------------
    console.log('\n\x1b[33m[Test 3/6]\x1b[0m Intentos de acceso de un Agente a rutas de Administrador...');
    // Login como agente
    const loginAgenteRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'agente@sfs.co', password: 'SFS2026!' })
    });
    const agenteCookie = loginAgenteRes.headers.get('set-cookie')?.split(';')[0] || '';
    assert(agenteCookie.includes(AUTH_COOKIE_NAME), 'Login exitoso de agente@sfs.co con cookie emitida');

    // Intentar consultar ruta admin
    const resAgenteAdmin = await fetch(`${BASE_URL}/api/admin/users`, {
      headers: { Cookie: agenteCookie }
    });
    const dataAgenteAdmin = await resAgenteAdmin.json();

    assert(
      resAgenteAdmin.status === 403 && dataAgenteAdmin.code === 'FORBIDDEN',
      'Agente recibe HTTP 403 FORBIDDEN al intentar consultar /api/admin/users',
      `Status recibido: ${resAgenteAdmin.status}`
    );

    // Intentar cambiar rol administrativo
    const resAgenteChangeRole = await fetch(`${BASE_URL}/api/users/change-role`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: agenteCookie
      },
      body: JSON.stringify({ userId: 'usr-agente-1', newRole: 'admin' })
    });
    const dataAgenteChangeRole = await resAgenteChangeRole.json();

    assert(
      resAgenteChangeRole.status === 403 && dataAgenteChangeRole.code === 'FORBIDDEN',
      'Agente recibe HTTP 403 FORBIDDEN al intentar cambiar roles a admin o supervisor',
      `Status: ${resAgenteChangeRole.status}`
    );

    // --------------------------------------------------------------------------
    // TEST 4: 403 con mustChangePassword (K8)
    // --------------------------------------------------------------------------
    console.log('\n\x1b[33m[Test 4/6]\x1b[0m Bloqueo de rutas protegidas si mustChangePassword = true...');
    // Login como cliente (tiene mustChangePassword = true inicialmente)
    const loginClienteRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'cliente@trilladoralamanuela.co', password: 'SFS2026!' })
    });
    let clienteCookie = loginClienteRes.headers.get('set-cookie')?.split(';')[0] || '';

    // Consultar /api/tickets con mustChangePassword = true
    const resClienteBlocked = await fetch(`${BASE_URL}/api/tickets`, {
      headers: { Cookie: clienteCookie }
    });
    const dataClienteBlocked = await resClienteBlocked.json();

    assert(
      resClienteBlocked.status === 403 && dataClienteBlocked.code === 'MUST_CHANGE_PASSWORD',
      'Usuario con mustChangePassword = true recibe HTTP 403 con code MUST_CHANGE_PASSWORD en /api/tickets',
      `Status: ${resClienteBlocked.status}, Code: ${dataClienteBlocked.code}`
    );

    // --------------------------------------------------------------------------
    // TEST 5: Cliente solo con tickets de su empresa y sin mensajes internos (K7)
    // --------------------------------------------------------------------------
    console.log('\n\x1b[33m[Test 5/6]\x1b[0m Aislamiento multi-inquilino de tickets y sanitización de mensajes...');
    // Cambiar contraseña del cliente para liberar mustChangePassword (ruta exenta permitida)
    const changePwdRes = await fetch(`${BASE_URL}/api/auth/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: clienteCookie
      },
      body: JSON.stringify({
        contrasenaActual: 'SFS2026!',
        nuevaContrasena: 'SFS2026!NuevaSegura123'
      })
    });
    const newCookieHeader = changePwdRes.headers.get('set-cookie');
    if (newCookieHeader) {
      clienteCookie = newCookieHeader.split(';')[0];
    }

    // Ahora consultar /api/tickets con el cliente ya habilitado
    const resClienteTickets = await fetch(`${BASE_URL}/api/tickets`, {
      headers: { Cookie: clienteCookie }
    });
    const dataClienteTickets = await resClienteTickets.json();

    const tickets: any[] = dataClienteTickets.tickets || [];
    assert(
      resClienteTickets.status === 200 && tickets.length > 0,
      'Cliente puede consultar /api/tickets tras actualizar su contraseña',
      `Tickets devueltos: ${tickets.length}`
    );

    const allTicketsSameCompany = tickets.every(
      (t) => t.company === 'Trilladora La Manuela'
    );
    assert(
      allTicketsSameCompany,
      'Todos los tickets devueltos corresponden exclusivamente a la empresa del cliente ("Trilladora La Manuela")'
    );

    let hasInternalMessages = false;
    for (const t of tickets) {
      if (Array.isArray(t.messages)) {
        for (const m of t.messages) {
          if (m.isInternal === true) {
            hasInternalMessages = true;
          }
        }
      }
    }
    assert(
      !hasInternalMessages,
      'Ningún ticket entregado al cliente contiene mensajes internos (isInternal === true)'
    );

    // --------------------------------------------------------------------------
    // TEST 6: Rate Limiting: 429 tras 5 fallos con Retry-After (K6)
    // --------------------------------------------------------------------------
    console.log('\n\x1b[33m[Test 6/6]\x1b[0m Rate limiting de intentos de login (máx. 5 fallos en 15 min)...');
    resetLoginRateLimits();

    const attackEmail = 'ataque-prueba@sfs.co';
    let fifthAttemptStatus = 0;

    for (let i = 1; i <= 5; i++) {
      const resFail = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: attackEmail, password: 'clave-incorrecta' })
      });
      fifthAttemptStatus = resFail.status;
    }
    assert(fifthAttemptStatus === 401, 'Los primeros 5 intentos fallidos devuelven HTTP 401');

    // 6to intento: debe bloquearse con 429
    const resBlocked = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: attackEmail, password: 'clave-incorrecta' })
    });
    const dataBlocked = await resBlocked.json();
    const retryAfter = resBlocked.headers.get('retry-after');

    assert(
      resBlocked.status === 429,
      'El 6to intento consecutivo es bloqueado con HTTP 429 Too Many Requests',
      `Status: ${resBlocked.status}`
    );
    assert(
      Boolean(retryAfter && Number(retryAfter) > 0),
      `Respuesta incluye cabecera Retry-After válida (segundos: ${retryAfter})`
    );
    assert(
      dataBlocked.error === 'Correo o contraseña incorrectos',
      'El mensaje de error responde con el mismo texto genérico ("Correo o contraseña incorrectos")'
    );
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }

  // --------------------------------------------------------------------------
  // RESUMEN
  // --------------------------------------------------------------------------
  console.log('\n\x1b[1m\x1b[34m=====================================================\x1b[0m');
  const total = results.length;
  const passed = results.filter((r) => r.passed).length;
  const failed = total - passed;

  if (failed === 0) {
    console.log(`\x1b[32m✔ TODAS LAS PRUEBAS DE SEGURIDAD PASARON EXITOSAMENTE (${passed}/${total})\x1b[0m`);
    console.log('\x1b[1m\x1b[34m=====================================================\x1b[0m\n');
    process.exit(0);
  } else {
    console.error(`\x1b[31m✘ ${failed} DE ${total} PRUEBAS FALLARON\x1b[0m`);
    console.log('\x1b[1m\x1b[34m=====================================================\x1b[0m\n');
    process.exit(1);
  }
}

runSecurityTests().catch((err) => {
  console.error('Error no controlado en la suite de pruebas:', err);
  process.exit(1);
});
