import * as jose from 'jose';
import { User, UserRole } from '../../src/types';
import {
  buscarUsuarioPorEmail,
  buscarUsuarioPorId,
  actualizarContrasena,
  verificarHashContrasena,
  generarHashContrasena,
  crearUsuario,
  actualizarRolUsuario,
  listarUsuarios,
  AuthUser
} from './repositorio';
import {
  checkLoginRateLimit,
  recordFailedLogin,
  recordSuccessfulLogin,
  resetLoginRateLimits
} from './rate-limit';

export const AUTH_COOKIE_NAME = 'sfs_session';

export interface SessionCookieResponse {
  cookie?: (...args: any[]) => void;
  setHeader?: (...args: any[]) => void;
}

// Valor local nuevo para desarrollo (mínimo 32 caracteres, NUNCA el valor anterior)
const DEV_AUTH_SECRET_FALLBACK = 'sfs_desk_dev_key_2026_super_secure_auth_32_chars!';

/**
 * Función centralizada getSecret() (Requirement 1 - K5):
 * Compartida por Express y /api.
 * - Lee process.env.AUTH_SECRET.
 * - Si falta o tiene menos de 32 caracteres y NODE_ENV === 'production', lanza un error crítico al arrancar.
 * - En desarrollo utiliza un nuevo valor local exclusivo de desarrollo.
 */
export function getSecret(): string {
  const secret = process.env.AUTH_SECRET;
  const isProduction = process.env.NODE_ENV === 'production';

  if (isProduction) {
    if (!secret || secret.trim().length < 32) {
      throw new Error(
        'CRITICAL_CONFIG_ERROR: process.env.AUTH_SECRET must be defined with at least 32 characters in production environments.'
      );
    }
    return secret;
  }

  if (secret && secret.trim().length >= 32) {
    return secret;
  }

  return DEV_AUTH_SECRET_FALLBACK;
}

export function getSecretKey(): Uint8Array {
  return new TextEncoder().encode(getSecret());
}

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
  code?: string;
  token?: string;
  user?: User;
  retryAfterSeconds?: number;
}

// Firmar JWT con jose con expiración de 8 horas usando la clave dinámica
export async function firmarTokenSesion(payload: SessionPayload): Promise<string> {
  return await new jose.SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('8h')
    .sign(getSecretKey());
}

// Verificar JWT con jose
export async function verificarTokenSesion(token: string): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jose.jwtVerify(token, getSecretKey());
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

// Iniciar sesión con validación bcryptjs, rate limiting y el mismo mensaje genérico
export async function iniciarSesion(
  email: string,
  password: string,
  clientIp: string = '127.0.0.1'
): Promise<IniciarSesionResult> {
  const GENERIC_ERROR_MSG = 'Correo o contraseña incorrectos';

  // 1. Validar límite de intentos (Requirement 5 - K6)
  const rateLimit = checkLoginRateLimit(email, clientIp);
  if (!rateLimit.allowed) {
    return {
      success: false,
      error: GENERIC_ERROR_MSG,
      code: 'TOO_MANY_ATTEMPTS',
      retryAfterSeconds: rateLimit.retryAfterSeconds
    };
  }

  if (!email || !password) {
    recordFailedLogin(email, clientIp);
    return { success: false, error: GENERIC_ERROR_MSG };
  }

  // Validación básica de formato de correo
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    recordFailedLogin(email, clientIp);
    return { success: false, error: 'Ingresa un correo válido' };
  }

  const user = await buscarUsuarioPorEmail(email);
  if (!user) {
    recordFailedLogin(email, clientIp);
    return { success: false, error: GENERIC_ERROR_MSG };
  }

  const passwordValida = verificarHashContrasena(password, user.passwordHash);
  if (!passwordValida) {
    recordFailedLogin(email, clientIp);
    return { success: false, error: GENERIC_ERROR_MSG };
  }

  // Login exitoso: limpiar historial de intentos fallidos
  recordSuccessfulLogin(email, clientIp);

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

  // Consultar el estado más reciente del usuario en el repositorio
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
// TODO: En el futuro, implementar lista de revocación de tokens (blacklist) mediante claim 'jti' (JWT ID)
// cuando exista base de datos o Redis para revocación inmediata antes de su expiración.
export async function cerrarSesion(response?: SessionCookieResponse): Promise<{ success: boolean }> {
  if (response?.cookie) {
    response.cookie(AUTH_COOKIE_NAME, '', {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 0,
      path: '/'
    });
  } else if (response?.setHeader) {
    response.setHeader(
      'Set-Cookie',
      `${AUTH_COOKIE_NAME}=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax${
        process.env.NODE_ENV === 'production' ? '; Secure' : ''
      }`
    );
  }

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

export {
  crearUsuario,
  actualizarRolUsuario,
  listarUsuarios,
  checkLoginRateLimit,
  recordFailedLogin,
  recordSuccessfulLogin,
  resetLoginRateLimits
};
