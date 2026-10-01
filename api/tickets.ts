import type { Request, Response } from 'express';
import { requireSession } from '../lib/auth/guard';
import { INITIAL_TICKETS } from '../src/data/mockData';

export default async function handler(req: Request, res: Response) {
  // Verificación centralizada mediante guard (Requirement 3 & 4)
  const session = await requireSession(req, res);
  if (!session) return;

  // Política estricta: el rol proviene exclusivamente del JWT verificado
  if (session.role === 'cliente') {
    const clientCompany = session.company;
    const clientTickets = INITIAL_TICKETS.filter(t => t.company === clientCompany).map(t => ({
      ...t,
      // Sanitizar mensajes internos en el servidor (Requirement 5 del brief original)
      messages: t.messages.filter(m => !m.isInternal)
    }));
    return res.status(200).json({ tickets: clientTickets });
  }

  // Agentes, supervisores y administradores reciben los tickets del sistema
  return res.status(200).json({ tickets: INITIAL_TICKETS });
}
