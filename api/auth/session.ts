import type { Request, Response } from 'express';
import { requireSession } from '../../lib/auth/guard';
import { buscarUsuarioPorId } from '../../lib/auth/repositorio';

export default async function handler(req: Request, res: Response) {
  const session = await requireSession(req, res, { allowPasswordChangeRoute: true });
  if (!session) return;

  const freshUser = await buscarUsuarioPorId(session.id);
  const userSafe = freshUser
    ? {
        id: freshUser.id,
        name: freshUser.name,
        email: freshUser.email,
        role: freshUser.role,
        title: freshUser.title,
        avatar: freshUser.avatar,
        company: freshUser.company,
        phone: freshUser.phone,
        mustChangePassword: freshUser.mustChangePassword
      }
    : session;

  return res.status(200).json({ user: userSafe });
}
