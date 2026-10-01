import type { Request, Response } from 'express';
import {
  cambiarContrasenaUsuario,
  iniciarSesion,
  verificarTokenSesion
} from '../../lib/auth/index';
import { cookieValue, setSessionCookie } from '../_utils';

export default async function handler(req: Request, res: Response) {
  const session = await verificarTokenSesion(cookieValue(req) || '');
  if (!session) {
    return res.status(401).json({ success: false, error: 'Sesión no válida o expirada' });
  }

  const { contrasenaActual, nuevaContrasena } = req.body || {};
  const result = await cambiarContrasenaUsuario(session.id, contrasenaActual, nuevaContrasena);
  if (!result.success || !result.user) {
    return res.status(400).json({ success: false, error: result.error });
  }

  const newSession = await iniciarSesion(session.email, nuevaContrasena);
  if (newSession.token) setSessionCookie(res, newSession.token);
  return res.status(200).json({ success: true, user: result.user });
}
