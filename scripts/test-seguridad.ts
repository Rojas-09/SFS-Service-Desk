import { spawn } from 'node:child_process';
import { once } from 'node:events';
import type { AddressInfo } from 'node:net';

process.env.NODE_ENV = 'test';
process.env.TEST_MODE = '1';

const { app } = await import('../server.ts');

type Json = Record<string, any>;

async function request(baseUrl: string, path: string, init: RequestInit = {}) {
  return fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...(init.headers || {})
    }
  });
}

async function json(response: Response): Promise<Json> {
  return (await response.json()) as Json;
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function login(baseUrl: string, email: string, ip: string) {
  const response = await request(baseUrl, '/api/auth/login', {
    method: 'POST',
    headers: { 'x-forwarded-for': ip },
    body: JSON.stringify({ email, password: 'SFS2026!' })
  });
  const data = await json(response);
  assert(response.ok && data.token, `No se pudo iniciar sesión como ${email}`);
  return data.token as string;
}

async function assertProductionFailsWithoutSecret(): Promise<void> {
  const env = { ...process.env };
  delete env.AUTH_SECRET;
  env.NODE_ENV = 'production';
  env.TEST_MODE = '1';

  const child = spawn(process.execPath, ['node_modules/tsx/dist/cli.mjs', 'server.ts'], {
    cwd: process.cwd(),
    env,
    stdio: ['ignore', 'pipe', 'pipe']
  });
  const output: string[] = [];
  child.stdout.on('data', chunk => output.push(String(chunk)));
  child.stderr.on('data', chunk => output.push(String(chunk)));

  const exitPromise = once(child, 'exit');
  const timeout = setTimeout(() => child.kill('SIGTERM'), 5000);
  const [code] = (await exitPromise) as [number | null];
  clearTimeout(timeout);

  assert(code !== 0, 'El servidor arrancó en producción sin AUTH_SECRET');
  assert(output.join('').includes('AUTH_SECRET'), 'El error de arranque no mencionó AUTH_SECRET');
}

const server = app.listen(0, '127.0.0.1');
await once(server, 'listening');
const { port } = server.address() as AddressInfo;
const baseUrl = `http://127.0.0.1:${port}`;

try {
  const withoutCookie = await request(baseUrl, '/api/tickets');
  assert(withoutCookie.status === 401, 'GET /api/tickets sin cookie no devolvió 401');
  console.log('PASS: 401 sin sesión');

  const agentToken = await login(baseUrl, 'agente@sfs.co', '198.51.100.10');
  const agentAdminRoute = await request(baseUrl, '/api/users', {
    headers: { Authorization: `Bearer ${agentToken}` }
  });
  assert(agentAdminRoute.status === 403, 'Un agente pudo acceder a /api/users');
  console.log('PASS: 403 para agente en ruta administrativa');

  const clientToken = await login(baseUrl, 'cliente@cafequindio.com', '198.51.100.11');
  const clientTicketsResponse = await request(baseUrl, '/api/tickets', {
    headers: { Authorization: `Bearer ${clientToken}` }
  });
  const clientTickets = await json(clientTicketsResponse);
  assert(clientTicketsResponse.ok, 'El cliente no pudo consultar sus tickets');
  assert(
    clientTickets.tickets.every((ticket: any) => ticket.company === 'Café Quindío S.A.S.'),
    'El cliente recibió tickets de otra empresa'
  );
  assert(
    clientTickets.tickets.every((ticket: any) =>
      ticket.messages.every((message: any) => message.isInternal !== true)
    ),
    'El cliente recibió mensajes internos'
  );
  console.log('PASS: cliente aislado por empresa y sin mensajes internos');

  const passwordChangeClientToken = await login(
    baseUrl,
    'cliente@trilladoralamanuela.co',
    '198.51.100.12'
  );
  const mustChangeResponse = await request(baseUrl, '/api/tickets', {
    headers: { Authorization: `Bearer ${passwordChangeClientToken}` }
  });
  const mustChangeData = await json(mustChangeResponse);
  assert(mustChangeResponse.status === 403, 'mustChangePassword no bloqueó /api/tickets');
  assert(mustChangeData.code === 'MUST_CHANGE_PASSWORD', 'Código MUST_CHANGE_PASSWORD ausente');
  console.log('PASS: 403 MUST_CHANGE_PASSWORD');

  const rateLimitIp = '198.51.100.13';
  for (let attempt = 1; attempt <= 5; attempt += 1) {
    const failed = await request(baseUrl, '/api/auth/login', {
      method: 'POST',
      headers: { 'x-forwarded-for': rateLimitIp },
      body: JSON.stringify({ email: 'no-existe@example.com', password: 'incorrecta' })
    });
    assert(failed.status === 401, `El fallo ${attempt} no devolvió 401`);
  }
  const blocked = await request(baseUrl, '/api/auth/login', {
    method: 'POST',
    headers: { 'x-forwarded-for': rateLimitIp },
    body: JSON.stringify({ email: 'no-existe@example.com', password: 'incorrecta' })
  });
  assert(blocked.status === 429, 'El sexto fallo no devolvió 429');
  assert(blocked.headers.get('retry-after'), 'La respuesta 429 no incluyó Retry-After');
  console.log('PASS: 429 tras cinco fallos y Retry-After');

  await assertProductionFailsWithoutSecret();
  console.log('PASS: producción no arranca sin AUTH_SECRET');
} finally {
  server.close();
}
