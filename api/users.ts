import type { Request, Response } from 'express';
import { requireSession } from '../lib/auth/guard';
import { listarUsuarios, crearUsuario, actualizarRolUsuario, buscarUsuarioPorId } from '../lib/auth/repositorio';
import { UserRole } from '../src/types';

export default async function handler(req: Request, res: Response) {
  // Supervisor y admin tienen acceso a ver y gestionar usuarios (Requirement 7)
  const session = await requireSession(req, res, { roles: ['admin', 'supervisor'] });
  if (!session) return;

  if (req.method === 'GET') {
    const users = await listarUsuarios();
    const safeUsers = users.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      title: u.title,
      avatar: u.avatar,
      company: u.company,
      phone: u.phone,
      mustChangePassword: u.mustChangePassword
    }));
    return res.status(200).json({ users: safeUsers });
  }

  if (req.method === 'POST') {
    const { action, userId, newRole, name, email, role, title, company } = req.body || {};

    // Acción: cambiar rol de usuario
    if (action === 'change-role') {
      if (!userId || !newRole) {
        return res.status(400).json({ error: 'Faltan parámetros requeridos' });
      }

      const targetUser = await buscarUsuarioPorId(userId);
      if (!targetUser) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      // Requirement 7: Solo el admin crea o cambia el rol de supervisores y admins
      const involvesAdminOrSupervisor =
        targetUser.role === 'admin' ||
        targetUser.role === 'supervisor' ||
        newRole === 'admin' ||
        newRole === 'supervisor';

      if (involvesAdminOrSupervisor && session.role !== 'admin') {
        return res.status(403).json({
          error: 'Solo el administrador puede cambiar el rol de supervisores y administradores',
          code: 'FORBIDDEN'
        });
      }

      const updated = await actualizarRolUsuario(userId, newRole as UserRole);
      return res.status(200).json({ success: true, user: updated });
    }

    // Acción: crear nuevo usuario
    if (!name || !email || !role || !title) {
      return res.status(400).json({ error: 'Faltan campos requeridos para crear el usuario' });
    }

    // Requirement 7: Solo el admin crea supervisores o admins
    if ((role === 'admin' || role === 'supervisor') && session.role !== 'admin') {
      return res.status(403).json({
        error: 'Solo el administrador puede crear usuarios con rol de supervisor o admin',
        code: 'FORBIDDEN'
      });
    }

    const created = await crearUsuario({
      name,
      email,
      role: role as UserRole,
      title,
      company
    });

    return res.status(201).json({ success: true, user: created });
  }

  return res.status(405).json({ error: 'Método no permitido' });
}
