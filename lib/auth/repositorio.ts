import bcrypt from 'bcryptjs';
import { User, UserRole } from '../../src/types';

export interface AuthUser extends User {
  passwordHash: string;
}

// Contraseña por defecto para todas las cuentas de prueba: SFS2026!
const DEFAULT_PASSWORD_HASH = '$2b$10$z4PL1GbctducO9KNtn4.VOaucpxPLVtU.NKSXMMuidO0sFLA9Q3.2';

// Repositorio de usuarios en memoria (hoy lee datos simulados, listo para conectar con BD)
let USERS_DATABASE: AuthUser[] = [
  {
    id: 'usr-cliente-1',
    name: 'Juan Camilo Duque',
    email: 'cliente@trilladoralamanuela.co',
    role: 'cliente' as UserRole,
    company: 'Trilladora La Manuela',
    title: 'Jefe de logística',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
    phone: '+57 312 849 2011',
    mustChangePassword: true, // Para probar el flujo del brief
    passwordHash: DEFAULT_PASSWORD_HASH
  },
  {
    id: 'usr-agente-1',
    name: 'Laura Yepes',
    email: 'agente@sfs.co',
    role: 'agente' as UserRole,
    company: 'Software Factory and Services',
    title: 'Especialista de soporte L2',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80',
    phone: '+57 301 555 4321',
    mustChangePassword: false,
    passwordHash: DEFAULT_PASSWORD_HASH
  },
  {
    id: 'usr-supervisor-1',
    name: 'Andrés Moreno',
    email: 'supervisor@sfs.co',
    role: 'supervisor' as UserRole,
    company: 'Software Factory and Services',
    title: 'Supervisor de operaciones y SLA',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&auto=format&fit=crop&q=80',
    phone: '+57 310 444 8899',
    mustChangePassword: false,
    passwordHash: DEFAULT_PASSWORD_HASH
  },
  {
    id: 'usr-admin-1',
    name: 'Carlos M. Restrepo',
    email: 'admin@sfs.co',
    role: 'admin' as UserRole,
    company: 'Software Factory and Services',
    title: 'Administrador del sistema',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=120&auto=format&fit=crop&q=80',
    phone: '+57 300 123 4567',
    mustChangePassword: false,
    passwordHash: DEFAULT_PASSWORD_HASH
  }
];

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

export function verificarHashContrasena(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash);
}

export function generarHashContrasena(password: string): string {
  return bcrypt.hashSync(password, 10);
}
