import type { Request, Response } from 'express';
import { INITIAL_TICKETS } from '../src/data/mockData';
import { sessionFromRequest } from './_utils';

export default async function handler(req: Request, res: Response) {
  const session = await sessionFromRequest(req);
  if (!session) return res.status(401).json({ error: 'No autenticado' });

  if (session.role === 'cliente') {
    const tickets = INITIAL_TICKETS.filter(ticket => ticket.company === session.company).map(ticket => ({
      ...ticket,
      messages: ticket.messages.filter(message => !message.isInternal)
    }));
    return res.status(200).json({ tickets });
  }

  return res.status(200).json({ tickets: INITIAL_TICKETS });
}
