/**
 * Utilidades para formateo de fechas y tiempos relativos
 * Zona horaria oficial: America/Bogota (UTC-5)
 * Formato estándar: dd/mm/aaaa (Intl.DateTimeFormat)
 * Eliminación total de textos fijos como "Hoy" y "Ayer".
 */

// Formateador estándar fecha dd/mm/aaaa en America/Bogota
const dateFormatter = new Intl.DateTimeFormat('es-CO', {
  timeZone: 'America/Bogota',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric'
});

// Formateador estándar fecha y hora dd/mm/aaaa, hh:mm a. m. en America/Bogota
const dateTimeFormatter = new Intl.DateTimeFormat('es-CO', {
  timeZone: 'America/Bogota',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  hour12: true
});

// Formateador solo hora hh:mm a. m./p. m.
const timeFormatter = new Intl.DateTimeFormat('es-CO', {
  timeZone: 'America/Bogota',
  hour: 'numeric',
  minute: '2-digit',
  hour12: true
});

/**
 * Convierte cualquier fecha a dd/mm/aaaa o dd/mm/aaaa, hh:mm a. m.
 */
export function formatFechaBogota(input: string | number | Date, includeTime = true): string {
  try {
    const d = typeof input === 'string' || typeof input === 'number' ? new Date(input) : input;
    if (isNaN(d.getTime())) return String(input);
    return includeTime ? dateTimeFormatter.format(d) : dateFormatter.format(d);
  } catch {
    return String(input);
  }
}

/**
 * Formatea solo la hora en formato 12h para Bogotá.
 */
export function formatHoraBogota(input: string | number | Date): string {
  try {
    const d = typeof input === 'string' || typeof input === 'number' ? new Date(input) : input;
    if (isNaN(d.getTime())) return '';
    return timeFormatter.format(d);
  } catch {
    return '';
  }
}

/**
 * Calcula el tiempo relativo dinámico desde la marca ISO (ej. 'hace 5 min', 'hace 2 h', 'hace 3 d').
 * Sin textos fijos ni "Hoy" / "Ayer".
 */
export function formatTiempoRelativo(input: string | number | Date, refDate = new Date()): string {
  try {
    const d = typeof input === 'string' || typeof input === 'number' ? new Date(input) : input;
    if (isNaN(d.getTime())) return String(input);

    const diffMs = refDate.getTime() - d.getTime();
    if (diffMs < 0) return 'en el futuro';

    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMinutes < 1) return 'hace un momento';
    if (diffMinutes < 60) return `hace ${diffMinutes} min`;
    if (diffHours < 24) return `hace ${diffHours} h`;
    if (diffDays === 1) return 'hace 1 d';
    if (diffDays < 30) return `hace ${diffDays} d`;
    const diffMonths = Math.floor(diffDays / 30);
    return `hace ${diffMonths} mes${diffMonths > 1 ? 'es' : ''}`;
  } catch {
    return String(input);
  }
}

/**
 * Calcula estado y porcentaje de SLA restante dinámico.
 */
export function calcularEstadoSLA(
  createdAtIso: string,
  slaLimitIso: string,
  isResolved = false,
  refDate = new Date()
) {
  if (isResolved) {
    return {
      slaMinutesRemaining: 0,
      slaRemainingPercent: 100,
      isBreached: false,
      slaFormatted: 'Cumplido'
    };
  }

  const createdTime = new Date(createdAtIso).getTime();
  const limitTime = new Date(slaLimitIso).getTime();
  const nowTime = refDate.getTime();

  const totalSlaMs = Math.max(1, limitTime - createdTime);
  const remainingMs = limitTime - nowTime;

  if (remainingMs <= 0) {
    const overdueMinutes = Math.abs(Math.floor(remainingMs / 60000));
    const overdueHours = Math.floor(overdueMinutes / 60);
    const overdueRemainingMins = overdueMinutes % 60;
    const overdueText = overdueHours > 0 
      ? `Vencido (+${overdueHours} h ${overdueRemainingMins} m)`
      : `Vencido (+${overdueMinutes} m)`;

    return {
      slaMinutesRemaining: 0,
      slaRemainingPercent: 0,
      isBreached: true,
      slaFormatted: overdueText
    };
  }

  const slaMinutesRemaining = Math.floor(remainingMs / 60000);
  const slaRemainingPercent = Math.min(100, Math.max(0, Math.round((remainingMs / totalSlaMs) * 100)));

  const hours = Math.floor(slaMinutesRemaining / 60);
  const mins = slaMinutesRemaining % 60;
  const slaFormatted = hours > 0 ? `${hours} h ${mins} min` : `${mins} min`;

  return {
    slaMinutesRemaining,
    slaRemainingPercent,
    isBreached: false,
    slaFormatted
  };
}
