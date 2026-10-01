import type { Request, Response } from 'express';
import { requireSession } from '../lib/auth/guard';
import {
  listarTickets,
  obtenerTicketPorId,
  crearNuevoTicket,
  actualizarTicket,
  agregarMensajeTicket,
  procesarOperacionLote
} from '../server/tickets-service';

export default async function handler(req: Request, res: Response) {
  // Verificación centralizada de sesión (K3 & K8)
  const session = await requireSession(req, res);
  if (!session) return;

  const url = req.url || '';
  const method = req.method;

  // Ruta /api/tickets/bulk
  if (url.includes('/bulk') && method === 'POST') {
    const result = procesarOperacionLote(session, req.body);
    if (result.errorStatus) {
      return res.status(result.errorStatus).json({ error: result.errorMsg });
    }
    return res.status(200).json({ success: true, count: result.modifiedCount });
  }

  // Rutas con ID de ticket: /api/tickets/:id o /api/tickets/:id/messages
  const idMatch = url.match(/\/api\/tickets\/([a-zA-Z0-9\-_#]+)(\/messages)?/);
  const ticketId = idMatch ? idMatch[1] : (req.query?.id as string | undefined);
  const isMessagesEndpoint = idMatch ? Boolean(idMatch[2]) : url.endsWith('/messages');

  if (ticketId && ticketId !== 'bulk') {
    if (isMessagesEndpoint && method === 'POST') {
      const result = agregarMensajeTicket(session, ticketId, req.body);
      if (result.errorStatus) {
        return res.status(result.errorStatus).json({ error: result.errorMsg });
      }
      return res.status(201).json({ message: result.message, ticket: result.ticket });
    }

    if (method === 'GET') {
      const result = obtenerTicketPorId(session, ticketId);
      if (result.errorStatus) {
        return res.status(result.errorStatus).json({ error: result.errorMsg });
      }
      return res.status(200).json({ ticket: result.ticket });
    }

    if (method === 'PATCH') {
      const result = actualizarTicket(session, ticketId, req.body);
      if (result.errorStatus) {
        return res.status(result.errorStatus).json({ error: result.errorMsg });
      }
      return res.status(200).json({ ticket: result.ticket });
    }
  }

  // Ruta raíz /api/tickets
  if (method === 'GET') {
    const tickets = listarTickets(session);
    return res.status(200).json({ tickets });
  }

  if (method === 'POST') {
    const nuevo = crearNuevoTicket(session, req.body);
    return res.status(201).json({ ticket: nuevo });
  }

  return res.status(405).json({ error: 'Método no permitido' });
}
