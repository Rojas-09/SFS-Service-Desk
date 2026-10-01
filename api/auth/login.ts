import type { Request, Response } from 'express';
import { iniciarSesion } from '../../lib/auth';
import { setSessionCookie } from '../_utils';

export default async function handler(req: Request, res: Response) {
  const { email, password } = req.body || {};
  const result = await iniciarSesion(email, password);

  if (!result.success || !result.token) {
    return res.status(401).json({ success: false, error: result.error });
  }

  setSessionCookie(res, result.token);
  return res.status(200).json({ success: true, user: result.user });
}
