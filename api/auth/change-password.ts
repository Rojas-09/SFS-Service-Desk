import type { Request, Response } from 'express';
import { requireSession } from '../../lib/auth/guard';
import { cambiarContrasenaUsuario, firmarTokenSesion, SessionPayload } from '../../lib/auth/index';
import { setSessionCookie } from '../_utils';

export default async function handler(req: Request, res: Response) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  // Ruta permitida incluso con mustChangePassword = true (Requirement 4)
  const session = await requireSession(req, res, { allowPasswordChangeRoute: true });
  if (!session) return;

  const { contrasenaActual, nuevaContrasena } = req.body || {};
  const result = await cambiarContrasenaUsuario(session.id, contrasenaActual, nuevaContrasena);

  if (!result.success || !result.user) {
    return res.status(400).json({ success: false, error: result.error });
  }

  // Generar nuevo token con mustChangePassword = false
  const updatedPayload: SessionPayload = {
    id: result.user.id,
    email: result.user.email,
    name: result.user.name,
    role: result.user.role,
    title: result.user.title,
    company: result.user.company,
    avatar: result.user.avatar,
    mustChangePassword: false
  };

  const newToken = await firmarTokenSesion(updatedPayload);
  setSessionCookie(res, newToken);

  return res.status(200).json({ success: true, user: result.user });
}
