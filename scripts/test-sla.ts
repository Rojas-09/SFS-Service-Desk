/**
 * Pruebas unitarias para el módulo calcularVencimiento (Requirement 7)
 * Ejecutable con: npx tsx scripts/test-sla.ts
 */

import {
  calcularVencimiento,
  makeBogotaDate,
  getBogotaDateParts,
  MATRIZ_SLA
} from '../lib/sla/index';

let passedCount = 0;
let totalCount = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  totalCount++;
  if (condition) {
    passedCount++;
    console.log(`  \x1b[32m✔\x1b[0m ${testName}`);
  } else {
    console.error(`  \x1b[31m✘\x1b[0m ${testName} - ${detail || 'Fallo'}`);
  }
}

console.log('\n\x1b[1m\x1b[34m=====================================================\x1b[0m');
console.log('\x1b[1m\x1b[34m   PRUEBAS UNITARIAS SLA - calcularVencimiento (K7)   \x1b[0m');
console.log('\x1b[1m\x1b[34m=====================================================\x1b[0m\n');

// Caso 1: Lunes 10:00 a. m. + 1 hora -> Lunes 11:00 a. m. (Crítica: 1 h primera respuesta)
{
  const lunes10am = makeBogotaDate(2026, 7, 10, 10, 0); // 10 de Agosto de 2026 (Lunes, no festivo)
  const vencimiento = calcularVencimiento(lunes10am, 1);
  const parts = getBogotaDateParts(vencimiento);
  assert(
    parts.day === 10 && parts.hours === 11 && parts.minutes === 0,
    'Suma 1 hora hábil dentro del mismo día laboral (10:00 -> 11:00)'
  );
}

// Caso 2: Lunes 16:00 + 4 horas -> Martes 10:00 a. m. (Crítica: 4 h solución)
{
  const lunes4pm = makeBogotaDate(2026, 7, 10, 16, 0); // Lunes 16:00
  const vencimiento = calcularVencimiento(lunes4pm, 4);
  const parts = getBogotaDateParts(vencimiento);
  assert(
    parts.day === 11 && parts.hours === 10 && parts.minutes === 0,
    'Suma 4 horas a las 16:00 y hace transición al día siguiente a las 10:00 (16:00-18:00 + 08:00-10:00)'
  );
}

// Caso 3: Viernes 16:00 + 4 horas -> Lunes 10:00 a. m. (Salto de fin de semana)
{
  const viernes4pm = makeBogotaDate(2026, 7, 14, 16, 0); // 14 de Agosto de 2026 (Viernes)
  const vencimiento = calcularVencimiento(viernes4pm, 4);
  const parts = getBogotaDateParts(vencimiento);
  // Sábado 15 y Domingo 16 se saltan -> Lunes 17 de Agosto a las 10:00 AM (Nota: 17 de agosto es festivo Asunción)
  // Como 2026-08-17 es festivo en Colombia, debe saltar al Martes 18 de Agosto a las 10:00 AM!
  assert(
    parts.day === 18 && parts.hours === 10 && parts.minutes === 0,
    'Salto de fin de semana y festivo colombiano (Viernes 14 16:00 -> Martes 18 10:00 por festivo el 17)'
  );
}

// Caso 4: Ticket creado fuera de horario: Domingo 20:00 + 1 hora -> Lunes 09:00 a. m.
{
  const domingoNoche = makeBogotaDate(2026, 7, 9, 20, 0); // 9 de Agosto de 2026 (Domingo)
  const vencimiento = calcularVencimiento(domingoNoche, 1);
  const parts = getBogotaDateParts(vencimiento);
  assert(
    parts.day === 10 && parts.hours === 9 && parts.minutes === 0,
    'Inicio en fin de semana se normaliza al lunes a las 08:00 a. m. y suma 1 hora -> 09:00 a. m.'
  );
}

// Caso 5: Ticket creado antes de horario hábil: Miércoles 06:30 a. m. + 2 horas -> Miércoles 10:00 a. m.
{
  const miercolesMadrugada = makeBogotaDate(2026, 7, 12, 6, 30); // Miércoles 06:30
  const vencimiento = calcularVencimiento(miercolesMadrugada, 2);
  const parts = getBogotaDateParts(vencimiento);
  assert(
    parts.day === 12 && parts.hours === 10 && parts.minutes === 0,
    'Inicio antes de las 08:00 a. m. inicia a las 08:00 a. m. exactas (08:00 + 2 h = 10:00)'
  );
}

// Caso 6: Alta (1 día hábil = 10 horas) desde Lunes 08:00 -> Lunes 18:00 (Fin de jornada)
{
  const lunes8am = makeBogotaDate(2026, 7, 10, 8, 0);
  const vencimiento = calcularVencimiento(lunes8am, MATRIZ_SLA.Alta.solucionHoras);
  const parts = getBogotaDateParts(vencimiento);
  assert(
    parts.day === 10 && parts.hours === 18 && parts.minutes === 0,
    '1 día hábil (10 horas) desde las 08:00 vence el mismo día a las 18:00 exactas'
  );
}

// Caso 7: Media (3 días hábiles = 30 horas) desde Lunes 08:00 -> Miércoles 18:00
{
  const lunes8am = makeBogotaDate(2026, 7, 10, 8, 0);
  const vencimiento = calcularVencimiento(lunes8am, MATRIZ_SLA.Media.solucionHoras);
  const parts = getBogotaDateParts(vencimiento);
  assert(
    parts.day === 12 && parts.hours === 18 && parts.minutes === 0,
    '3 días hábiles (30 horas) desde Lunes 08:00 vence Miércoles a las 18:00'
  );
}

// Caso 8: Baja (5 días hábiles = 50 horas) desde Lunes 08:00 -> Viernes 18:00
{
  const lunes8am = makeBogotaDate(2026, 7, 10, 8, 0);
  const vencimiento = calcularVencimiento(lunes8am, MATRIZ_SLA.Baja.solucionHoras);
  const parts = getBogotaDateParts(vencimiento);
  assert(
    parts.day === 14 && parts.hours === 18 && parts.minutes === 0,
    '5 días hábiles (50 horas) desde Lunes 08:00 vence Viernes a las 18:00'
  );
}

console.log('\n-----------------------------------------------------');
console.log(`Resultado: ${passedCount}/${totalCount} pruebas pasadas.`);
if (passedCount === totalCount) {
  console.log('\x1b[32m✔ TODAS LAS PRUEBAS DE SLA PASARON SATISFACTORIAMENTE\x1b[0m\n');
} else {
  console.error('\x1b[31m✘ HUBIERON FALLAS EN LAS PRUEBAS DE SLA\x1b[0m\n');
  process.exit(1);
}
