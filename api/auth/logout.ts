import type { Request, Response } from 'express';
import { clearSessionCookie } from '../_utils';
import { cerrarSesion } from '../../lib/auth/index';

export default async function handler(_req: Request, res: Response) {
  await cerrarSesion();
  clearSessionCookie(res);
  return res.status(200).json({ success: true });
}
