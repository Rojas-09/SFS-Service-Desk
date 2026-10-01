import express from 'express';
import cookieParser from 'cookie-parser';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import {
  iniciarSesion,
  obtenerSesion,
  cambiarContrasenaUsuario,
  cerrarSesion,
  AUTH_COOKIE_NAME,
  getSecret,
  firmarTokenSesion,
  SessionPayload
} from './lib/auth/index';
import { requireSession } from './lib/auth/guard';
import {
  listarUsuarios,
  crearUsuario,
  actualizarRolUsuario,
  buscarUsuarioPorId
} from './lib/auth/repositorio';
import {
  listarTickets,
  obtenerTicketPorId,
  crearNuevoTicket,
  actualizarTicket,
  agregarMensajeTicket,
  procesarOperacionLote
} from './server/tickets-service';
import { UserRole } from './src/types';

// Requirement 1 (K5): Validar AUTH_SECRET al arrancar.
// Si NODE_ENV === 'production' y falta o tiene menos de 32 caracteres, lanza un error fatal.
getSecret();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());
app.use(cookieParser());

function getClientIp(req: express.Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  if (Array.isArray(forwarded) && forwarded.length > 0) {
    return forwarded[0].trim();
  }
  return req.ip || req.socket?.remoteAddress || '127.0.0.1';
}

function setSessionCookie(res: express.Response, token: string): void {
  res.cookie(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 8 * 60 * 60 * 1000,
    path: '/'
  });
}

function clearSessionCookie(res: express.Response): void {
  // Requirement 6 (K7): Borra la cookie con Max-Age=0 y los mismos atributos
  res.cookie(AUTH_COOKIE_NAME, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 0,
    path: '/'
  });
}

// ================= RUTAS DE AUTENTICACIÓN =================

// Iniciar sesión (Server Action / Endpoint con Rate Limit de 5 intentos en 15 min - Requirement 5)
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body || {};
  const clientIp = getClientIp(req);
  const result = await iniciarSesion(email, password, clientIp);

  if (!result.success || !result.token) {
    if (result.code === 'TOO_MANY_ATTEMPTS') {
      res.setHeader('Retry-After', String(result.retryAfterSeconds || 900));
      return res.status(429).json({
        success: false,
        error: result.error,
        code: 'TOO_MANY_ATTEMPTS'
      });
    }
    return res.status(401).json({ success: false, error: result.error });
  }

  setSessionCookie(res, result.token);
  return res.json({
    success: true,
    user: result.user,
    token: result.token
  });
});

// Cerrar sesión (Requirement 6 - K7)
app.post('/api/auth/logout', async (_req, res) => {
  await cerrarSesion();
  clearSessionCookie(res);
  return res.json({ success: true });
});

// Obtener sesión activa (Requirement 3 & 4 - K3, K8)
app.get('/api/auth/session', async (req, res) => {
  const session = await requireSession(req, res, { allowPasswordChangeRoute: true });
  if (!session) return;

  const freshUser = await buscarUsuarioPorId(session.id);
  const safeUser = freshUser
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

  return res.json({ user: safeUser });
});

// Cambiar contraseña (Requirement 4 - K8: ruta exenta de bloqueo por mustChangePassword)
app.post('/api/auth/change-password', async (req, res) => {
  const session = await requireSession(req, res, { allowPasswordChangeRoute: true });
  if (!session) return;

  const { contrasenaActual, nuevaContrasena } = req.body || {};
  const result = await cambiarContrasenaUsuario(session.id, contrasenaActual, nuevaContrasena);

  if (!result.success || !result.user) {
    return res.status(400).json({ success: false, error: result.error });
  }

  // Renovar token con mustChangePassword = false
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

  return res.json({ success: true, user: result.user });
});

// ================= RUTAS PROTEGIDAS DE TICKETS (Requirement 2) =================

// Operación masiva en lote (POST /api/tickets/bulk)
app.post('/api/tickets/bulk', async (req, res) => {
  const session = await requireSession(req, res);
  if (!session) return;
  const result = procesarOperacionLote(session, req.body);
  if (result.errorStatus) {
    return res.status(result.errorStatus).json({ error: result.errorMsg });
  }
  return res.json({ success: true, count: result.modifiedCount });
});

// Consulta de tickets (Requirement 2 & 3)
// El rol proviene exclusivamente del JWT verificado.
// Un cliente solo obtiene tickets de SU empresa y nunca ve mensajes con interno = true.
app.get('/api/tickets', async (req, res) => {
  const session = await requireSession(req, res);
  if (!session) return;
  const tickets = listarTickets(session);
  return res.json({ tickets });
});

// Crear nuevo ticket (POST /api/tickets)
app.post('/api/tickets', async (req, res) => {
  const session = await requireSession(req, res);
  if (!session) return;
  const nuevo = crearNuevoTicket(session, req.body);
  return res.status(201).json({ ticket: nuevo });
});

// Consultar ticket por ID (GET /api/tickets/:id)
app.get('/api/tickets/:id', async (req, res) => {
  const session = await requireSession(req, res);
  if (!session) return;
  const result = obtenerTicketPorId(session, req.params.id);
  if (result.errorStatus) {
    return res.status(result.errorStatus).json({ error: result.errorMsg });
  }
  return res.json({ ticket: result.ticket });
});

// Modificar ticket (PATCH /api/tickets/:id)
app.patch('/api/tickets/:id', async (req, res) => {
  const session = await requireSession(req, res);
  if (!session) return;
  const result = actualizarTicket(session, req.params.id, req.body);
  if (result.errorStatus) {
    return res.status(result.errorStatus).json({ error: result.errorMsg });
  }
  return res.json({ ticket: result.ticket });
});

// Agregar mensaje o nota (POST /api/tickets/:id/messages)
app.post('/api/tickets/:id/messages', async (req, res) => {
  const session = await requireSession(req, res);
  if (!session) return;
  const result = agregarMensajeTicket(session, req.params.id, req.body);
  if (result.errorStatus) {
    return res.status(result.errorStatus).json({ error: result.errorMsg });
  }
  return res.status(201).json({ message: result.message, ticket: result.ticket });
});

// Directorio de usuarios: accesible por supervisor y admin (Requirement 7)
app.get('/api/users', async (req, res) => {
  const session = await requireSession(req, res, { roles: ['admin', 'supervisor'] });
  if (!session) return;

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
  return res.json({ users: safeUsers });
});

// Ruta exclusiva de administración (Requirement 7 & 8)
app.get('/api/admin/users', async (req, res) => {
  const session = await requireSession(req, res, { roles: ['admin'] });
  if (!session) return;

  const users = await listarUsuarios();
  return res.json({ users });
});

// Cambio de rol de usuario (Requirement 7: Solo admin crea o cambia rol de supervisores y admins)
app.post('/api/users/change-role', async (req, res) => {
  const session = await requireSession(req, res, { roles: ['admin', 'supervisor'] });
  if (!session) return;

  const { userId, newRole } = req.body || {};
  if (!userId || !newRole) {
    return res.status(400).json({ error: 'Parámetros inválidos' });
  }

  const targetUser = await buscarUsuarioPorId(userId);
  if (!targetUser) {
    return res.status(404).json({ error: 'Usuario no encontrado' });
  }

  const involvesAdminOrSupervisor =
    targetUser.role === 'admin' ||
    targetUser.role === 'supervisor' ||
    newRole === 'admin' ||
    newRole === 'supervisor';

  if (involvesAdminOrSupervisor && session.role !== 'admin') {
    return res.status(403).json({
      error: 'Solo el administrador puede cambiar roles de supervisores y administradores',
      code: 'FORBIDDEN'
    });
  }

  const updated = await actualizarRolUsuario(userId, newRole as UserRole);
  return res.json({ success: true, user: updated });
});

// Crear usuario (Requirement 7)
app.post('/api/users', async (req, res) => {
  const session = await requireSession(req, res, { roles: ['admin', 'supervisor'] });
  if (!session) return;

  const { name, email, role, title, company } = req.body || {};
  if (!name || !email || !role || !title) {
    return res.status(400).json({ error: 'Faltan campos requeridos' });
  }

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
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
    app.use('*', async (req, res, next) => {
      const url = req.originalUrl;
      if (url.startsWith('/api')) {
        return next();
      }
      try {
        let template = fs.readFileSync(path.resolve('index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  } else {
    app.use(express.static('dist'));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve('dist/index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

const isTestRunner =
  process.env.NODE_ENV === 'test' ||
  Boolean(process.env.TEST_MODE) ||
  Boolean(process.argv[1] && process.argv[1].includes('test'));

if (process.env.VERCEL !== '1' && !isTestRunner) {
  startServer();
}

export { app };
