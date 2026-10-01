import type { Request, Response } from 'express';
import { UserRole } from '../../src/types';
import { AUTH_COOKIE_NAME, verificarTokenSesion, SessionPayload } from './index';

export interface RequireSessionOptions {
  roles?: UserRole[];
  allowPasswordChangeRoute?: boolean;
}

export interface GuardVerificationResult {
  ok: boolean;
  status: 200 | 401 | 403;
  code?: 'UNAUTHORIZED' | 'FORBIDDEN' | 'MUST_CHANGE_PASSWORD';
  error?: string;
  session: SessionPayload | null;
}

/**
 * Extrae el token de la cookie o cabeceras de la solicitud.
 */
export function extractToken(req: Request | any): string | null {
  // 1. req.cookies si express cookie-parser está presente
  if (req.cookies && typeof req.cookies === 'object' && req.cookies[AUTH_COOKIE_NAME]) {
    return req.cookies[AUTH_COOKIE_NAME];
  }

  // 2. req.headers.cookie
  const cookieHeader = req.headers?.cookie;
  if (cookieHeader) {
    const cookies = cookieHeader.split(';');
    for (const cookie of cookies) {
      const [name, ...rest] = cookie.trim().split('=');
      if (name === AUTH_COOKIE_NAME) {
        return rest.join('=');
      }
    }
  }

  // 3. Authorization Bearer header como fallback seguro
  const authHeader = req.headers?.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7).trim();
  }

  return null;
}

/**
 * Verifica si una ruta está exenta del bloqueo por mustChangePassword = true.
 * Exentas: /api/auth/change-password, /api/auth/session, /api/auth/logout.
 */
function isExemptFromPasswordChange(req: Request | any, options?: RequireSessionOptions): boolean {
  if (options?.allowPasswordChangeRoute) return true;

  const url = (req.originalUrl || req.url || '').split('?')[0];
  return (
    url.includes('/api/auth/change-password') ||
    url.includes('/api/auth/session') ||
    url.includes('/api/auth/logout')
  );
}

/**
 * Verificación lógica de sesión sin responder directamente.
 */
export async function verifySession(
  req: Request | any,
  options?: RequireSessionOptions
): Promise<GuardVerificationResult> {
  const token = extractToken(req);

  if (!token) {
    return {
      ok: false,
      status: 401,
      code: 'UNAUTHORIZED',
      error: 'Sesión no válida o no autenticada',
      session: null
    };
  }

  const session = await verificarTokenSesion(token);
  if (!session) {
    return {
      ok: false,
      status: 401,
      code: 'UNAUTHORIZED',
      error: 'Sesión expirada o no válida',
      session: null
    };
  }

  // 1. Verificación de mustChangePassword (Requirement 4 - K8)
  if (session.mustChangePassword && !isExemptFromPasswordChange(req, options)) {
    return {
      ok: false,
      status: 403,
      code: 'MUST_CHANGE_PASSWORD',
      error: 'Debes cambiar tu contraseña antes de continuar',
      session
    };
  }

  // 2. Verificación de roles permitidos (Requirement 3 & 7 - K3)
  // El rol proviene EXCLUSIVAMENTE del payload del JWT verificado, nunca de body/query/headers
  if (options?.roles && options.roles.length > 0) {
    if (!options.roles.includes(session.role)) {
      return {
        ok: false,
        status: 403,
        code: 'FORBIDDEN',
        error: 'No tienes permisos suficientes para realizar esta acción',
        session
      };
    }
  }

  return {
    ok: true,
    status: 200,
    session
  };
}

/**
 * Autorización centralizada (Requirement 3 & 4 - K3, K8):
 * - 401 si no hay sesión válida.
 * - 403 { code: 'MUST_CHANGE_PASSWORD' } si mustChangePassword=true en rutas no exentas.
 * - 403 { code: 'FORBIDDEN' } si el rol no está permitido.
 *
 * Puede llamarse como requireSession(req, res, options) o requireSession(req, options).
 */
export async function requireSession(
  req: Request | any,
  resOrOptions?: Response | any | RequireSessionOptions,
  maybeOptions?: RequireSessionOptions
): Promise<SessionPayload | null> {
  // Determinar si el segundo parámetro es el objeto Response de Express/Vercel
  const isResponse =
    resOrOptions &&
    typeof resOrOptions.status === 'function' &&
    typeof resOrOptions.json === 'function';

  const res: Response | null = isResponse ? resOrOptions : null;
  const options: RequireSessionOptions | undefined = isResponse
    ? maybeOptions
    : (resOrOptions as RequireSessionOptions);

  const result = await verifySession(req, options);

  if (!result.ok) {
    if (res) {
      res.status(result.status).json({
        error: result.error,
        code: result.code
      });
    }
    return null;
  }

  return result.session;
}
