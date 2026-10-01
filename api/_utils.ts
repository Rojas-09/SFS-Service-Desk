import type { Request, Response } from 'express';
import { AUTH_COOKIE_NAME, getSecret, verificarTokenSesion } from '../lib/auth/index';
import { extractToken } from '../lib/auth/guard';

// Validar secreto centralizado al importar
export { getSecret };

export function cookieValue(req: Request): string | undefined {
  return extractToken(req) || undefined;
}

export function setSessionCookie(res: Response, token: string): void {
  res.setHeader(
    'Set-Cookie',
    `${AUTH_COOKIE_NAME}=${token}; Max-Age=28800; Path=/; HttpOnly; SameSite=Lax${
      process.env.NODE_ENV === 'production' ? '; Secure' : ''
    }`
  );
}

export function clearSessionCookie(res: Response): void {
  res.setHeader(
    'Set-Cookie',
    `${AUTH_COOKIE_NAME}=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax${
      process.env.NODE_ENV === 'production' ? '; Secure' : ''
    }`
  );
}

export function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  if (Array.isArray(forwarded) && forwarded.length > 0) {
    return forwarded[0].trim();
  }
  return req.ip || req.socket?.remoteAddress || '127.0.0.1';
}

export async function sessionFromRequest(req: Request) {
  const token = cookieValue(req);
  return token ? verificarTokenSesion(token) : null;
}
