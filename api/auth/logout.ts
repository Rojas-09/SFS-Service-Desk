import type { Request, Response } from 'express';
import { cerrarSesion } from '../../lib/auth/index';

export default async function handler(_req: Request, res: Response) {
  await cerrarSesion(res);
  return res.status(200).json({ success: true });
}
