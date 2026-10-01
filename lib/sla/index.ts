/**
 * Módulo de cálculo y gestión de Acuerdos de Nivel de Servicio (SLA)
 * Horario hábil de Colombia: Lunes a Viernes, 8:00 a. m. a 6:00 p. m. (America/Bogota, UTC-5).
 * 1 día hábil = 10 horas de servicio (08:00 a 18:00).
 */

import { Priority } from '../../src/types';

// Festivos oficiales de Colombia para 2025 y 2026 (configurables)
export const FESTIVOS_COLOMBIA: string[] = [
  // 2025
  '2025-01-01', '2025-01-06', '2025-03-24', '2025-04-17', '2025-04-18',
  '2025-05-01', '2025-06-02', '2025-06-23', '2025-06-30', '2025-07-20',
  '2025-08-07', '2025-08-18', '2025-10-13', '2025-11-03', '2025-11-17',
  '2025-12-08', '2025-12-25',
  // 2026
  '2026-01-01', '2026-01-12', '2026-03-23', '2026-04-02', '2026-04-03',
  '2026-05-01', '2026-05-18', '2026-06-08', '2026-06-15', '2026-06-29',
  '2026-07-20', '2026-08-07', '2026-08-17', '2026-10-12', '2026-11-02',
  '2026-11-16', '2026-12-08', '2026-12-25',
  // 2027
  '2027-01-01', '2027-01-11'
];

export interface ReglaSLAMatriz {
  prioridad: Priority;
  primeraRespuestaHoras: number;
  solucionHoras: number;
  primeraRespuestaLabel: string;
  solucionLabel: string;
}

/**
 * Matriz SLA oficial según requerimiento:
 * - Crítica: 1 h / 4 h
 * - Alta: 4 h / 1 día (10 h hábiles)
 * - Media: 8 h / 3 días (30 h hábiles)
 * - Baja: 1 día (10 h hábiles) / 5 días (50 h hábiles)
 */
export const MATRIZ_SLA: Record<Priority, ReglaSLAMatriz> = {
  Crítica: {
    prioridad: 'Crítica',
    primeraRespuestaHoras: 1,
    solucionHoras: 4,
    primeraRespuestaLabel: '1 h',
    solucionLabel: '4 h'
  },
  Alta: {
    prioridad: 'Alta',
    primeraRespuestaHoras: 4,
    solucionHoras: 10, // 1 día hábil
    primeraRespuestaLabel: '4 h',
    solucionLabel: '1 día'
  },
  Media: {
    prioridad: 'Media',
    primeraRespuestaHoras: 8,
    solucionHoras: 30, // 3 días hábiles
    primeraRespuestaLabel: '8 h',
    solucionLabel: '3 días'
  },
  Baja: {
    prioridad: 'Baja',
    primeraRespuestaHoras: 10, // 1 día hábil
    solucionHoras: 50, // 5 días hábiles
    primeraRespuestaLabel: '1 día',
    solucionLabel: '5 días'
  }
};

export const HORA_INICIO_HABIL = 8;  // 8:00 a. m.
export const HORA_FIN_HABIL = 18;    // 6:00 p. m.
export const HORAS_POR_DIA_HABIL = HORA_FIN_HABIL - HORA_INICIO_HABIL; // 10 horas

export interface BogotaDateParts {
  year: number;
  month: number; // 0-11
  day: number; // 1-31
  dayOfWeek: number; // 0 (Dom) a 6 (Sáb)
  hours: number;
  minutes: number;
  seconds: number;
  ms: number;
  isoDateString: string; // YYYY-MM-DD
}

/**
 * Extrae partes de fecha en zona horaria America/Bogota (UTC-5 fijo, sin cambio de hora).
 */
export function getBogotaDateParts(d: Date): BogotaDateParts {
  const bogotaOffsetMs = -5 * 60 * 60 * 1000;
  const bogotaTime = new Date(d.getTime() + bogotaOffsetMs);
  const year = bogotaTime.getUTCFullYear();
  const month = bogotaTime.getUTCMonth();
  const day = bogotaTime.getUTCDate();
  const dayOfWeek = bogotaTime.getUTCDay();
  const hours = bogotaTime.getUTCHours();
  const minutes = bogotaTime.getUTCMinutes();
  const seconds = bogotaTime.getUTCSeconds();
  const ms = bogotaTime.getUTCMilliseconds();
  const isoDateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  return { year, month, day, dayOfWeek, hours, minutes, seconds, ms, isoDateString };
}

/**
 * Construye un objeto Date a partir de componentes en horario local de Bogotá.
 */
export function makeBogotaDate(
  year: number,
  month: number,
  day: number,
  hours: number,
  minutes = 0,
  seconds = 0,
  ms = 0
): Date {
  return new Date(Date.UTC(year, month, day, hours + 5, minutes, seconds, ms));
}

/**
 * Determina si una fecha dada en Bogotá corresponde a día laboral (L-V y no festivo).
 */
export function esDiaHabil(parts: BogotaDateParts, festivos: string[] = FESTIVOS_COLOMBIA): boolean {
  if (parts.dayOfWeek === 0 || parts.dayOfWeek === 6) return false;
  return !festivos.includes(parts.isoDateString);
}

/**
 * Avanza la fecha al siguiente día hábil a las 08:00 a. m.
 */
export function avanzarSiguienteDiaHabil(current: Date, festivos: string[] = FESTIVOS_COLOMBIA): Date {
  let parts = getBogotaDateParts(current);
  // Avanzar al día siguiente a las 8:00 am
  let next = makeBogotaDate(parts.year, parts.month, parts.day + 1, HORA_INICIO_HABIL, 0, 0, 0);

  while (true) {
    parts = getBogotaDateParts(next);
    if (esDiaHabil(parts, festivos)) {
      return next;
    }
    next = makeBogotaDate(parts.year, parts.month, parts.day + 1, HORA_INICIO_HABIL, 0, 0, 0);
  }
}

/**
 * Normaliza un instante al inicio hábil válido más cercano:
 * - Si es fin de semana o festivo -> 8:00 a. m. del próximo día hábil.
 * - Si es día hábil antes de las 8:00 a. m. -> 8:00 a. m. del mismo día.
 * - Si es día hábil después de las 6:00 p. m. -> 8:00 a. m. del próximo día hábil.
 * - Si está en horario hábil (L-V 8am-6pm) -> se mantiene intacto.
 */
export function normalizarInicioHabil(d: Date, festivos: string[] = FESTIVOS_COLOMBIA): Date {
  let parts = getBogotaDateParts(d);

  if (!esDiaHabil(parts, festivos)) {
    return avanzarSiguienteDiaHabil(d, festivos);
  }

  if (parts.hours < HORA_INICIO_HABIL) {
    return makeBogotaDate(parts.year, parts.month, parts.day, HORA_INICIO_HABIL, 0, 0, 0);
  }

  if (parts.hours >= HORA_FIN_HABIL) {
    return avanzarSiguienteDiaHabil(d, festivos);
  }

  return d;
}

/**
 * Calcula la fecha y hora de vencimiento para una cantidad dada de horas hábiles.
 * Horario: Lunes a Viernes 08:00 a 18:00 (America/Bogota).
 * 
 * @param inicio Fecha inicial (Date o string ISO 8601).
 * @param horas Cantidad de horas hábiles a sumar.
 * @param festivos Lista opcional de fechas festivas 'YYYY-MM-DD'.
 * @returns Date con el vencimiento exacto.
 */
export function calcularVencimiento(
  inicio: Date | string,
  horas: number,
  festivos: string[] = FESTIVOS_COLOMBIA
): Date {
  if (horas <= 0) {
    return typeof inicio === 'string' ? new Date(inicio) : new Date(inicio.getTime());
  }

  const initialDate = typeof inicio === 'string' ? new Date(inicio) : inicio;
  let curr = normalizarInicioHabil(initialDate, festivos);
  let horasRestantes = horas;

  while (horasRestantes > 0) {
    const parts = getBogotaDateParts(curr);
    const horasConsumidasHoy = (parts.hours - HORA_INICIO_HABIL) + (parts.minutes / 60) + (parts.seconds / 3600);
    const horasDisponiblesHoy = HORAS_POR_DIA_HABIL - horasConsumidasHoy;

    if (horasRestantes <= horasDisponiblesHoy) {
      const msToAdd = Math.round(horasRestantes * 60 * 60 * 1000);
      return new Date(curr.getTime() + msToAdd);
    }

    // Consumir el resto del día de hoy y avanzar al siguiente día hábil a las 8:00 a. m.
    horasRestantes -= horasDisponiblesHoy;
    curr = avanzarSiguienteDiaHabil(curr, festivos);
  }

  return curr;
}

/**
 * Devuelve el cálculo completo de SLA para un ticket según su prioridad y fecha de creación.
 */
export function calcularSlaTicket(
  createdAtIso: string,
  priority: Priority,
  festivos: string[] = FESTIVOS_COLOMBIA
) {
  const matriz = MATRIZ_SLA[priority] || MATRIZ_SLA.Media;
  const firstResponseLimit = calcularVencimiento(createdAtIso, matriz.primeraRespuestaHoras, festivos);
  const solutionLimit = calcularVencimiento(createdAtIso, matriz.solucionHoras, festivos);

  return {
    matriz,
    firstResponseLimitIso: firstResponseLimit.toISOString(),
    solutionLimitIso: solutionLimit.toISOString()
  };
}
