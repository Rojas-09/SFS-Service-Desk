import bcrypt from 'bcryptjs';
import type { User, UserRole } from '../../src/types';
import { SEED_USERS } from '../../server/data/seed';

export interface AuthUser extends User {
  passwordHash: string;
}

// Repositorio de usuarios en memoria alimentado desde la semilla oficial del servidor
let USERS_DATABASE: AuthUser[] = SEED_USERS.map(u => ({ ...u }));

export async function buscarUsuarioPorEmail(email: string): Promise<AuthUser | null> {
  const normalized = email.trim().toLowerCase();
  const user = USERS_DATABASE.find(u => u.email.toLowerCase() === normalized);
  return user ? { ...user } : null;
}

export async function buscarUsuarioPorId(id: string): Promise<AuthUser | null> {
  const user = USERS_DATABASE.find(u => u.id === id);
  return user ? { ...user } : null;
}

export async function actualizarContrasena(
  userId: string,
  nuevoPasswordHash: string
): Promise<boolean> {
  const userIndex = USERS_DATABASE.findIndex(u => u.id === userId);
  if (userIndex === -1) return false;

  USERS_DATABASE[userIndex] = {
    ...USERS_DATABASE[userIndex],
    passwordHash: nuevoPasswordHash,
    mustChangePassword: false
  };
  return true;
}

export async function listarUsuarios(): Promise<AuthUser[]> {
  return USERS_DATABASE.map(u => ({ ...u }));
}

export async function crearUsuario(nuevo: {
  name: string;
  email: string;
  role: UserRole;
  company?: string;
  title: string;
  phone?: string;
  password?: string;
}): Promise<AuthUser> {
  const password = nuevo.password || 'SFS2026!';
  const authUser: AuthUser = {
    id: `usr-${Date.now()}`,
    name: nuevo.name,
    email: nuevo.email.toLowerCase().trim(),
    role: nuevo.role,
    company: nuevo.company || 'Software Factory and Services',
    title: nuevo.title,
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
    phone: nuevo.phone || '+57 300 000 0000',
    mustChangePassword: false,
    passwordHash: generarHashContrasena(password)
  };
  USERS_DATABASE.push(authUser);
  return { ...authUser };
}

export async function actualizarRolUsuario(userId: string, newRole: UserRole): Promise<AuthUser | null> {
  const index = USERS_DATABASE.findIndex(u => u.id === userId);
  if (index === -1) return null;
  USERS_DATABASE[index] = {
    ...USERS_DATABASE[index],
    role: newRole
  };
  return { ...USERS_DATABASE[index] };
}

export function verificarHashContrasena(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash);
}

export function generarHashContrasena(password: string): string {
  return bcrypt.hashSync(password, 10);
}
