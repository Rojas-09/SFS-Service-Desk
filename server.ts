import express from 'express';
import cookieParser from 'cookie-parser';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import {
  iniciarSesion,
  obtenerSesion,
  cambiarContrasenaUsuario,
  AUTH_COOKIE_NAME,
  verificarTokenSesion
} from './lib/auth';
import { INITIAL_TICKETS } from './src/data/mockData';

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());
app.use(cookieParser());

// Server API: Iniciar sesión (Server Action / Endpoint)
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const result = await iniciarSesion(email, password);

  if (!result.success || !result.token) {
    return res.status(401).json({ success: false, error: result.error });
  }

  // Cookie httpOnly, sameSite=lax con expiración de 8 h (Requirement 2)
  res.cookie(AUTH_COOKIE_NAME, result.token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 8 * 60 * 60 * 1000,
    path: '/'
  });

  return res.json({
    success: true,
    user: result.user
  });
});

// Server API: Cerrar sesión
app.post('/api/auth/logout', (req, res) => {
  res.clearCookie(AUTH_COOKIE_NAME, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/'
  });
  return res.json({ success: true });
});

// Server API: Obtener sesión activa
app.get('/api/auth/session', async (req, res) => {
  const token = req.cookies[AUTH_COOKIE_NAME];
  const user = await obtenerSesion(token);
  return res.json({ user });
});

// Server API: Cambiar contraseña
app.post('/api/auth/change-password', async (req, res) => {
  const token = req.cookies[AUTH_COOKIE_NAME];
  const session = await verificarTokenSesion(token);

  if (!session) {
    return res.status(401).json({ success: false, error: 'Sesión no válida o expirada' });
  }

  const { contrasenaActual, nuevaContrasena } = req.body;
  const result = await cambiarContrasenaUsuario(session.id, contrasenaActual, nuevaContrasena);

  if (!result.success || !result.user) {
    return res.status(400).json({ success: false, error: result.error });
  }

  // Renovar token con mustChangePassword = false
  const newToken = await iniciarSesion(session.email, nuevaContrasena);
  if (newToken.token) {
    res.cookie(AUTH_COOKIE_NAME, newToken.token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 8 * 60 * 60 * 1000,
      path: '/'
    });
  }

  return res.json({ success: true, user: result.user });
});

// Server API: Consulta de tickets protegida por rol (Requirement 5)
// Un cliente solo obtiene tickets de SU empresa y nunca ve mensajes con interno = true
app.get('/api/tickets', async (req, res) => {
  const token = req.cookies[AUTH_COOKIE_NAME];
  const session = await verificarTokenSesion(token);

  if (!session) {
    return res.status(401).json({ error: 'No autenticado' });
  }

  if (session.role === 'cliente') {
    const clientCompany = session.company;
    const clientTickets = INITIAL_TICKETS.filter(t => t.company === clientCompany).map(t => ({
      ...t,
      // Sanitizar mensajes internos para que el cliente NUNCA los reciba en la red
      messages: t.messages.filter(m => !m.isInternal)
    }));
    return res.json({ tickets: clientTickets });
  }

  // Agente, supervisor o admin reciben tickets completos
  return res.json({ tickets: INITIAL_TICKETS });
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
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

// Vercel imports the Express app as a serverless function instead of starting
// a long-lived listener. Local development keeps the existing server entrypoint.
if (process.env.VERCEL !== '1') {
  startServer();
}

export { app };
