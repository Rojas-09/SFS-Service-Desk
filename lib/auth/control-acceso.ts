import { verificarTokenSesion, SessionPayload } from './index';

export interface MiddlewareResult {
  redirect?: string;
  status?: number;
  forbiddenReason?: string;
  allowed: boolean;
  session?: SessionPayload | null;
}

/**
 * Middleware de protección de rutas compatible con Edge Runtime y Node.js.
 * Verifica el JWT mediante jose y aplica las políticas de control de acceso por rol (RBAC).
 */
export async function middleware(
  pathname: string,
  token?: string | null
): Promise<MiddlewareResult> {
  // Limpiar pathname (remover trailing slashes si no es "/")
  const cleanPath = pathname.length > 1 && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;

  const session = token ? await verificarTokenSesion(token) : null;

  // 1. CASO: USUARIO SIN SESIÓN
  if (!session) {
    // Si intenta acceder a consola, portal o cambiar contraseña:
    if (
      cleanPath.startsWith('/consola') ||
      cleanPath.startsWith('/portal') ||
      cleanPath === '/cambiar-contrasena'
    ) {
      return {
        allowed: false,
        redirect: `/login?next=${encodeURIComponent(cleanPath)}`
      };
    }

    // Raíz sin sesión redirige a /login
    if (cleanPath === '/') {
      return {
        allowed: false,
        redirect: '/login'
      };
    }

    // Rutas públicas permitidas sin sesión (ej. /login)
    return {
      allowed: true,
      session: null
    };
  }

  // 2. CASO: USUARIO CON SESIÓN Y DEBE CAMBIAR CONTRASEÑA (mustChangePassword = true)
  if (session.mustChangePassword) {
    if (cleanPath !== '/cambiar-contrasena' && !cleanPath.startsWith('/api/')) {
      return {
        allowed: false,
        redirect: '/cambiar-contrasena',
        session
      };
    }
  }

  // 3. CASO: USUARIO CON SESIÓN ACCEDIENDO A /login O /
  if (cleanPath === '/login' || cleanPath === '/') {
    if (session.role === 'cliente') {
      return {
        allowed: false,
        redirect: '/portal',
        session
      };
    }
    // Agente, supervisor o admin van a /consola/bandeja
    return {
      allowed: false,
      redirect: '/consola/bandeja',
      session
    };
  }

  // 4. POLÍTICAS POR ROL: CLIENTE
  if (session.role === 'cliente') {
    // Cliente solo puede entrar a /portal/* o /cambiar-contrasena
    if (cleanPath.startsWith('/consola')) {
      return {
        allowed: false,
        redirect: '/portal',
        session
      };
    }

    if (cleanPath.startsWith('/portal') || cleanPath === '/cambiar-contrasena') {
      return {
        allowed: true,
        session
      };
    }
  }

  // 5. POLÍTICAS POR ROL: AGENTE
  if (session.role === 'agente') {
    // Si intenta acceder a portal, redirige a consola
    if (cleanPath.startsWith('/portal')) {
      return {
        allowed: false,
        redirect: '/consola/bandeja',
        session
      };
    }

    // Secciones bloqueadas para Agente: Métricas, Anuncios, Empresas, Usuarios, Configuración
    const seccionesBloqueadasAgente = [
      '/consola/metricas',
      '/consola/anuncios',
      '/consola/empresas',
      '/consola/usuarios',
      '/consola/configuracion'
    ];

    if (seccionesBloqueadasAgente.some(p => cleanPath === p || cleanPath.startsWith(`${p}/`))) {
      return {
        allowed: false,
        status: 403,
        forbiddenReason:
          'Acceso no autorizado para tu rol de Agente. Las secciones operativas y analíticas requieren permisos de Supervisor o Administrador.',
        session
      };
    }

    return {
      allowed: true,
      session
    };
  }

  // 6. POLÍTICAS POR ROL: SUPERVISOR
  if (session.role === 'supervisor') {
    if (cleanPath.startsWith('/portal')) {
      return {
        allowed: false,
        redirect: '/consola/bandeja',
        session
      };
    }

    // Solo el admin gestiona Usuarios y Configuración
    if (
      cleanPath === '/consola/usuarios' ||
      cleanPath.startsWith('/consola/usuarios/') ||
      cleanPath === '/consola/configuracion' ||
      cleanPath.startsWith('/consola/configuracion/')
    ) {
      return {
        allowed: false,
        status: 403,
        forbiddenReason:
          'Acceso restringido. Solo los usuarios con rol de Administrador pueden gestionar el directorio de usuarios y los parámetros del sistema.',
        session
      };
    }

    return {
      allowed: true,
      session
    };
  }

  // 7. POLÍTICAS POR ROL: ADMIN
  if (session.role === 'admin') {
    if (cleanPath.startsWith('/portal')) {
      return {
        allowed: false,
        redirect: '/consola/bandeja',
        session
      };
    }

    // Admin tiene acceso total a toda la consola
    return {
      allowed: true,
      session
    };
  }

  return {
    allowed: true,
    session
  };
}
