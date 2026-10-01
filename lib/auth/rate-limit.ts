/**
 * Control de tasa de intentos de autenticación (Login Rate Limiter).
 * Máximo 5 fallos por correo y por IP en una ventana de 15 minutos.
 *
 * NOTA DE ARQUITECTURA:
 * Este contador de tasa se almacena en memoria local por proceso/instancia.
 * En entornos serverless o despliegues distribuidos multi-instancia en producción real,
 * este almacenamiento debe delegarse a una base de datos o almacén de datos distribuido en memoria
 * (como Redis o Cloud Memorystore) para compartir el estado entre réplicas.
 */

interface FailedAttemptRecord {
  timestamps: number[];
}

const MAX_FAILED_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutos en milisegundos

// Almacén en memoria indexado por clave compuesta "email:ip" y por "ip" y "email"
const emailAttempts = new Map<string, FailedAttemptRecord>();
const ipAttempts = new Map<string, FailedAttemptRecord>();

function getValidTimestamps(record: FailedAttemptRecord | undefined, now: number): number[] {
  if (!record) return [];
  return record.timestamps.filter(ts => now - ts < WINDOW_MS);
}

export interface RateLimitCheckResult {
  allowed: boolean;
  retryAfterSeconds?: number;
}

/**
 * Verifica si un intento de login está permitido para el email e IP indicados.
 */
export function checkLoginRateLimit(email: string, ip: string): RateLimitCheckResult {
  const now = Date.now();
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedIp = ip.trim();

  const emailHistory = getValidTimestamps(emailAttempts.get(normalizedEmail), now);
  const ipHistory = getValidTimestamps(ipAttempts.get(normalizedIp), now);

  const emailBlocked = emailHistory.length >= MAX_FAILED_ATTEMPTS;
  const ipBlocked = ipHistory.length >= MAX_FAILED_ATTEMPTS;

  if (emailBlocked || ipBlocked) {
    // Calcular el tiempo restante en segundos del intento más antiguo dentro de la ventana
    const oldestTimestamp = Math.min(
      ...(emailBlocked ? [emailHistory[0]] : []),
      ...(ipBlocked ? [ipHistory[0]] : [])
    );
    const msRemaining = Math.max(0, oldestTimestamp + WINDOW_MS - now);
    const retryAfterSeconds = Math.ceil(msRemaining / 1000) || 1;

    return {
      allowed: false,
      retryAfterSeconds
    };
  }

  return { allowed: true };
}

/**
 * Registra un fallo de login para el email y la IP indicados.
 */
export function recordFailedLogin(email: string, ip: string): void {
  const now = Date.now();
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedIp = ip.trim();

  // Actualizar por email
  const currentEmailHistory = getValidTimestamps(emailAttempts.get(normalizedEmail), now);
  currentEmailHistory.push(now);
  emailAttempts.set(normalizedEmail, { timestamps: currentEmailHistory });

  // Actualizar por IP
  const currentIpHistory = getValidTimestamps(ipAttempts.get(normalizedIp), now);
  currentIpHistory.push(now);
  ipAttempts.set(normalizedIp, { timestamps: currentIpHistory });
}

/**
 * Limpia los fallos acumulados tras un login exitoso.
 */
export function recordSuccessfulLogin(email: string, ip: string): void {
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedIp = ip.trim();
  emailAttempts.delete(normalizedEmail);
  ipAttempts.delete(normalizedIp);
}

/**
 * Utilidad para reiniciar contadores (para tests automáticos).
 */
export function resetLoginRateLimits(): void {
  emailAttempts.clear();
  ipAttempts.clear();
}
