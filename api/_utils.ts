import type { Request, Response } from 'express';
import { AUTH_COOKIE_NAME, verificarTokenSesion } from '../lib/auth/index';

export function cookieValue(req: Request): string | undefined {
  const cookies = req.headers.cookie?.split(';') || [];
  const entry = cookies.find(cookie => cookie.trim().startsWith(`${AUTH_COOKIE_NAME}=`));
  return entry?.trim().slice(`${AUTH_COOKIE_NAME}=`.length);
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

export async function sessionFromRequest(req: Request) {
  const token = cookieValue(req);
  return token ? verificarTokenSesion(token) : null;
}
