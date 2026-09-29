import * as jose from 'jose';
import { User, UserRole } from '../../src/types';
import {
  buscarUsuarioPorEmail,
  buscarUsuarioPorId,
  actualizarContrasena,
  verificarHashContrasena,
  generarHashContrasena,
  AuthUser
} from './repositorio';

export const AUTH_COOKIE_NAME = 'sfs_session';
export const AUTH_SECRET = process.env.AUTH_SECRET || 'sfs-desk-super-secret-key-2026-auth-token';
const SECRET_KEY = new TextEncoder().encode(AUTH_SECRET);

export interface SessionPayload {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  title: string;
  company?: string;
  avatar: string;
  mustChangePassword?: boolean;
}

export interface IniciarSesionResult {
  success: boolean;
  error?: string;
  token?: string;
  user?: User;
}

// Firmar JWT con jose con expiración de 8 horas
export async function firmarTokenSesion(payload: SessionPayload): Promise<string> {
  return await new jose.SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('8h')
    .sign(SECRET_KEY);
}

// Verificar JWT con jose
export async function verificarTokenSesion(token: string): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jose.jwtVerify(token, SECRET_KEY);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

// Iniciar sesión con validación bcryptjs y el mismo mensaje de error para usuario inexistente o contraseña incorrecta
export async function iniciarSesion(
  email: string,
  password: string
): Promise<IniciarSesionResult> {
  const ERROR_MSG = 'Correo o contraseña incorrectos';

  if (!email || !password) {
    return { success: false, error: ERROR_MSG };
  }

  // Validación básica de formato de correo
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return { success: false, error: 'Ingresa un correo válido' };
  }

  const user = await buscarUsuarioPorEmail(email);
  if (!user) {
    return { success: false, error: ERROR_MSG };
  }

  const passwordValida = verificarHashContrasena(password, user.passwordHash);
  if (!passwordValida) {
    return { success: false, error: ERROR_MSG };
  }

  const sessionPayload: SessionPayload = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    title: user.title,
    company: user.company,
    avatar: user.avatar,
    mustChangePassword: user.mustChangePassword
  };

  const token = await firmarTokenSesion(sessionPayload);

  // Devolver usuario sin passwordHash
  const userSafe: User = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    title: user.title,
    avatar: user.avatar,
    company: user.company,
    phone: user.phone,
    mustChangePassword: user.mustChangePassword
  };

  return {
    success: true,
    token,
    user: userSafe
  };
}

// Obtener sesión activa verificando el JWT
export async function obtenerSesion(token?: string | null): Promise<User | null> {
  if (!token) return null;
  const payload = await verificarTokenSesion(token);
  if (!payload) return null;

  // Consultar el estado más reciente del usuario
  const user = await buscarUsuarioPorId(payload.id);
  if (!user) return null;

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    title: user.title,
    avatar: user.avatar,
    company: user.company,
    phone: user.phone,
    mustChangePassword: user.mustChangePassword
  };
}

// Cerrar sesión
export async function cerrarSesion(): Promise<{ success: boolean }> {
  return { success: true };
}

// Cambiar contraseña
export async function cambiarContrasenaUsuario(
  userId: string,
  contrasenaActual: string,
  nuevaContrasena: string
): Promise<{ success: boolean; error?: string; user?: User }> {
  if (nuevaContrasena.length < 10) {
    return { success: false, error: 'La nueva contraseña debe tener al menos 10 caracteres' };
  }

  const user = await buscarUsuarioPorId(userId);
  if (!user) {
    return { success: false, error: 'Usuario no encontrado' };
  }

  const passwordValida = verificarHashContrasena(contrasenaActual, user.passwordHash);
  if (!passwordValida) {
    return { success: false, error: 'La contraseña actual no es correcta' };
  }

  const nuevoHash = generarHashContrasena(nuevaContrasena);
  await actualizarContrasena(userId, nuevoHash);

  const updatedUser = await buscarUsuarioPorId(userId);
  if (!updatedUser) return { success: false, error: 'Error actualizando contraseña' };

  return {
    success: true,
    user: {
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      title: updatedUser.title,
      avatar: updatedUser.avatar,
      company: updatedUser.company,
      phone: updatedUser.phone,
      mustChangePassword: false
    }
  };
}
