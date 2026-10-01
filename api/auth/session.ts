import type { Request, Response } from 'express';
import { obtenerSesion } from '../../lib/auth/index';
import { cookieValue } from '../_utils';

export default async function handler(req: Request, res: Response) {
  const user = await obtenerSesion(cookieValue(req));
  return res.status(200).json({ user });
}
