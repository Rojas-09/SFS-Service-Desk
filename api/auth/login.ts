import type { Request, Response } from 'express';
import { iniciarSesion } from '../../lib/auth/index';
import { setSessionCookie, getClientIp } from '../_utils';

export default async function handler(req: Request, res: Response) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { email, password } = req.body || {};
  const clientIp = getClientIp(req);
  const result = await iniciarSesion(email, password, clientIp);

  if (!result.success || !result.token) {
    // Si excede 5 intentos en 15 min, responder 429 con Retry-After y el mismo mensaje genérico (Requirement 5)
    if (result.code === 'TOO_MANY_ATTEMPTS') {
      res.setHeader('Retry-After', String(result.retryAfterSeconds || 900));
      return res.status(429).json({ success: false, error: result.error, code: 'TOO_MANY_ATTEMPTS' });
    }
    return res.status(401).json({ success: false, error: result.error });
  }

  setSessionCookie(res, result.token);
  return res.status(200).json({ success: true, user: result.user, token: result.token });
}
