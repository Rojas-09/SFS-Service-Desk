import type { Request, Response } from 'express';
import { clearSessionCookie } from '../_utils';

export default function handler(_req: Request, res: Response) {
  clearSessionCookie(res);
  return res.status(200).json({ success: true });
}
