/**
 * Servicio central de Tickets en el servidor (server/tickets-service.ts).
 * Contiene la persistencia en memoria y la lógica de negocio con verificación de sesión y roles.
 * 
 * Reglas de negocio:
 * 1. GET /api/tickets:
 *    - Cliente: solo tickets de su empresa y sin mensajes internos (isInternal === true).
 *    - Equipo SFS: todos los tickets con todos los mensajes.
 * 2. GET /api/tickets/:id:
 *    - Cliente: solo si es de su empresa y sin mensajes internos.
 * 3. POST /api/tickets:
 *    - Genera código correlativo #SFS-####.
 *    - Calcula SLA con calcularVencimiento según la prioridad.
 *    - Cliente: empresa forzada a su empresa de sesión.
 *    - Agrega EventoTicket de creación.
 * 4. PATCH /api/tickets/:id:
 *    - Actualiza estado y/o agente.
 *    - Agente: solo puede modificar tickets asignados a él o sin asignar.
 *    - Agrega EventoTicket del cambio.
 * 5. POST /api/tickets/:id/messages:
 *    - Cliente NUNCA puede enviar interno=true (devuelve 403 o error).
 *    - Agrega EventoTicket del mensaje.
 * 6. POST /api/tickets/bulk:
 *    - Asignar o cambiar estado en lote.
 *    - Agente solo puede modificar sus tickets o sin asignar.
 *    - Agrega EventoTicket por cada ticket modificado.
 */

import { Ticket, TicketStatus, Priority, Mensaje, EventoTicket } from '../src/types';
import { SessionPayload } from '../lib/auth/index';
import { SERVER_TICKETS_DATABASE, SEED_COMPANIES } from './data/seed';
import { calcularVencimiento, MATRIZ_SLA } from '../lib/sla/index';
import { formatFechaBogota, formatTiempoRelativo, calcularEstadoSLA } from '../src/utils/fechas';

/**
 * Sanitiza un ticket para el cliente:
 * - Oculta mensajes internos (isInternal === true).
 */
export function sanitizarTicketParaCliente(ticket: Ticket): Ticket {
  return {
    ...ticket,
    messages: ticket.messages.filter(m => !m.isInternal)
  };
}

/**
 * Lista tickets filtrados según el rol y empresa de la sesión.
 */
export function listarTickets(session: SessionPayload): Ticket[] {
  if (session.role === 'cliente') {
    const clientCompany = session.company;
    return SERVER_TICKETS_DATABASE
      .filter(t => t.company === clientCompany)
      .map(sanitizarTicketParaCliente);
  }

  // Agente, Supervisor, Admin reciben todos los tickets
  return [...SERVER_TICKETS_DATABASE];
}

/**
 * Obtiene un ticket por ID con control de acceso por empresa.
 */
export function obtenerTicketPorId(
  session: SessionPayload,
  id: string
): { errorStatus?: number; errorMsg?: string; ticket?: Ticket } {
  const ticket = SERVER_TICKETS_DATABASE.find(t => t.id === id || t.code === id);
  if (!ticket) {
    return { errorStatus: 404, errorMsg: 'Ticket no encontrado' };
  }

  if (session.role === 'cliente') {
    if (ticket.company !== session.company) {
      return { errorStatus: 403, errorMsg: 'No tienes autorización para consultar tickets de otra empresa' };
    }
    return { ticket: sanitizarTicketParaCliente(ticket) };
  }

  return { ticket: { ...ticket } };
}

/**
 * Crea un nuevo ticket con código #SFS-#### y SLA calculado en horario hábil.
 */
export function crearNuevoTicket(
  session: SessionPayload,
  data: {
    title: string;
    description: string;
    company?: string;
    category: string;
    module: string;
    priority: Priority;
    tags?: string[];
    requesterName?: string;
    requesterEmail?: string;
    requesterPhone?: string;
    requesterTitle?: string;
  }
): Ticket {
  // Obtener el mayor consecutivo actual #SFS-XXXX
  let maxNum = 1000;
  for (const t of SERVER_TICKETS_DATABASE) {
    const match = t.code.match(/#SFS-(\d+)/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxNum) maxNum = num;
    }
  }

  const nextNum = maxNum + 1;
  const code = `#SFS-${nextNum}`;
  const id = `t-${nextNum}`;

  // Empresa: si es cliente, es forzosamente la empresa de su sesión
  const companyName = session.role === 'cliente'
    ? (session.company || 'Trilladora La Manuela')
    : (data.company || session.company || 'Café Quindío S.A.S.');

  const empresaObj = SEED_COMPANIES.find(c => c.name === companyName);
  const companyNit = empresaObj?.nit || '800.000.000-1';

  const requesterName = session.role === 'cliente'
    ? session.name
    : (data.requesterName || session.name);

  const requesterEmail = session.role === 'cliente'
    ? session.email
    : (data.requesterEmail || session.email);

  const requesterPhone = data.requesterPhone || empresaObj?.contactPhone || '+57 300 000 0000';
  const requesterTitle = data.requesterTitle || (session.role === 'cliente' ? session.title : 'Solicitante');

  const now = new Date();
  const createdAtIso = now.toISOString();
  const createdAtFormatted = formatFechaBogota(now, true);
  const createdHoursAgo = formatTiempoRelativo(now, now);

  const priority: Priority = data.priority || 'Media';
  const reglaSla = MATRIZ_SLA[priority] || MATRIZ_SLA.Media;

  const slaFirstResponseLimitDate = calcularVencimiento(now, reglaSla.primeraRespuestaHoras);
  const slaSolutionLimitDate = calcularVencimiento(now, reglaSla.solucionHoras);

  const slaLimitIso = slaSolutionLimitDate.toISOString();
  const slaLimit = formatFechaBogota(slaSolutionLimitDate, true);

  const slaEstado = calcularEstadoSLA(createdAtIso, slaLimitIso, false, now);

  const messages: Mensaje[] = [
    {
      id: `msg-${id}-1`,
      senderName: requesterName,
      senderRole: session.role === 'cliente' ? 'cliente' : 'soporte',
      senderEmail: requesterEmail,
      time: createdAtFormatted,
      timestamp: now.getTime(),
      createdAtIso,
      content: data.description
    }
  ];

  const history: EventoTicket[] = [
    {
      id: `evt-${id}-1`,
      action: 'Ticket creado',
      detail: `Ticket registrado con prioridad ${priority}, categoría "${data.category}" y módulo "${data.module}"`,
      user: requesterName,
      time: createdAtFormatted,
      timestamp: now.getTime(),
      createdAtIso
    }
  ];

  const nuevoTicket: Ticket = {
    id,
    code,
    title: data.title,
    description: data.description,
    company: companyName,
    companyNit,
    requesterName,
    requesterTitle,
    requesterEmail,
    requesterPhone,
    module: data.module || 'Portal Web Clientes',
    category: data.category || 'Error del sistema',
    tags: Array.isArray(data.tags) && data.tags.length > 0 ? data.tags : ['Nuevo'],
    priority,
    status: 'Nuevo',
    createdAt: createdAtFormatted,
    createdAtIso,
    createdHoursAgo,
    slaLimit,
    slaLimitIso,
    slaFirstResponseLimitIso: slaFirstResponseLimitDate.toISOString(),
    slaMinutesRemaining: slaEstado.slaMinutesRemaining,
    slaFormatted: slaEstado.slaFormatted,
    slaRemainingPercent: slaEstado.slaRemainingPercent,
    isBreached: false,
    messages,
    history
  };

  SERVER_TICKETS_DATABASE.unshift(nuevoTicket);
  return nuevoTicket;
}

/**
 * Actualiza estado y/o agente de un ticket (PATCH /api/tickets/:id).
 * Regla: Un agente solo puede modificar sus tickets o tickets sin asignar.
 */
export function actualizarTicket(
  session: SessionPayload,
  id: string,
  updates: {
    status?: TicketStatus;
    assignedAgent?: { name: string; avatar: string; role: string; email?: string } | null;
  }
): { errorStatus?: number; errorMsg?: string; ticket?: Ticket } {
  if (session.role === 'cliente') {
    return { errorStatus: 403, errorMsg: 'Los clientes no tienen autorización para modificar estado o agente de tickets' };
  }

  const ticketIndex = SERVER_TICKETS_DATABASE.findIndex(t => t.id === id || t.code === id);
  if (ticketIndex === -1) {
    return { errorStatus: 404, errorMsg: 'Ticket no encontrado' };
  }

  const ticket = SERVER_TICKETS_DATABASE[ticketIndex];

  // Regla: un agente solo en sus tickets o sin asignar
  if (session.role === 'agente') {
    const isUnassigned = !ticket.assignedAgent || !ticket.assignedAgent.name;
    const isAssignedToMe = ticket.assignedAgent && ticket.assignedAgent.name.toLowerCase().includes(session.name.split(' ')[0].toLowerCase());

    if (!isUnassigned && !isAssignedToMe) {
      return {
        errorStatus: 403,
        errorMsg: `Acceso denegado: El agente solo puede modificar tickets asignados a su cuenta o tickets sin asignar (ticket asignado a ${ticket.assignedAgent?.name})`
      };
    }
  }

  const now = new Date();
  const timeFormatted = formatFechaBogota(now, true);
  const timestamp = now.getTime();
  const createdAtIso = now.toISOString();

  // Cambio de estado
  if (updates.status && updates.status !== ticket.status) {
    const prevStatus = ticket.status;
    ticket.status = updates.status;

    ticket.history.push({
      id: `evt-${ticket.id}-${Date.now()}-st`,
      action: 'Estado modificado',
      detail: `Estado cambiado de "${prevStatus}" a "${updates.status}"`,
      user: session.name,
      time: timeFormatted,
      timestamp,
      createdAtIso
    });

    if (updates.status === 'Resuelto' || updates.status === 'Cerrado') {
      ticket.resolvedAtIso = createdAtIso;
      ticket.resolutionTime = 'Resuelto en SLA';
      ticket.slaFormatted = 'Cumplido';
      ticket.slaMinutesRemaining = 0;
      ticket.slaRemainingPercent = 100;
      ticket.isBreached = false;
    }
  }

  // Asignación de agente
  if (updates.assignedAgent !== undefined) {
    const prevAgentName = ticket.assignedAgent?.name || 'Sin asignar';
    ticket.assignedAgent = updates.assignedAgent || undefined;

    ticket.history.push({
      id: `evt-${ticket.id}-${Date.now()}-ag`,
      action: 'Agente asignado',
      detail: `Agente reasignado de "${prevAgentName}" a "${updates.assignedAgent?.name || 'Sin asignar'}"`,
      user: session.name,
      time: timeFormatted,
      timestamp,
      createdAtIso
    });

    // Si estaba Nuevo y se asigna agente, pasa a Asignado automáticamente
    if (ticket.status === 'Nuevo' && updates.assignedAgent) {
      ticket.status = 'Asignado';
    }
  }

  return { ticket: { ...ticket } };
}

/**
 * Agrega un mensaje al ticket (POST /api/tickets/:id/messages).
 * Regla: Un cliente NUNCA puede enviar interno=true.
 */
export function agregarMensajeTicket(
  session: SessionPayload,
  id: string,
  body: {
    content: string;
    isInternal?: boolean;
    attachment?: { name: string; size: string };
  }
): { errorStatus?: number; errorMsg?: string; message?: Mensaje; ticket?: Ticket } {
  const ticket = SERVER_TICKETS_DATABASE.find(t => t.id === id || t.code === id);
  if (!ticket) {
    return { errorStatus: 404, errorMsg: 'Ticket no encontrado' };
  }

  if (session.role === 'cliente') {
    if (ticket.company !== session.company) {
      return { errorStatus: 403, errorMsg: 'No tienes autorización para enviar mensajes a tickets de otra empresa' };
    }
    // Regla estricta: un cliente NUNCA puede enviar interno=true
    if (body.isInternal === true) {
      return {
        errorStatus: 403,
        errorMsg: 'Violación de seguridad: los clientes tienen prohibido enviar mensajes con el indicador interno=true'
      };
    }
  }

  if (!body.content || !body.content.trim()) {
    return { errorStatus: 400, errorMsg: 'El contenido del mensaje no puede estar vacío' };
  }

  const now = new Date();
  const timeFormatted = formatFechaBogota(now, true);
  const timestamp = now.getTime();
  const createdAtIso = now.toISOString();
  const isInternal = session.role === 'cliente' ? false : Boolean(body.isInternal);

  const nuevoMensaje: Mensaje = {
    id: `msg-${ticket.id}-${Date.now()}`,
    senderName: session.name,
    senderRole: session.role === 'cliente' ? 'cliente' : 'soporte',
    senderEmail: session.email,
    time: timeFormatted,
    timestamp,
    createdAtIso,
    content: body.content.trim(),
    isInternal,
    attachment: body.attachment
  };

  ticket.messages.push(nuevoMensaje);

  // Registro de evento en historial
  ticket.history.push({
    id: `evt-${ticket.id}-${Date.now()}-msg`,
    action: isInternal ? 'Nota interna agregada' : 'Mensaje enviado',
    detail: isInternal
      ? `Nota interna confidencial registrada por ${session.name}`
      : `Mensaje registrado por ${session.name} (${session.role})`,
    user: session.name,
    time: timeFormatted,
    timestamp,
    createdAtIso
  });

  // Si el cliente responde y estaba en 'En espera del cliente', pasar a 'En progreso'
  if (session.role === 'cliente' && ticket.status === 'En espera del cliente') {
    ticket.status = 'En progreso';
    ticket.history.push({
      id: `evt-${ticket.id}-${Date.now()}-reopen`,
      action: 'Respuesta de cliente',
      detail: 'Estado cambiado automáticamente a "En progreso" tras respuesta del cliente',
      user: 'Sistema SFS',
      time: timeFormatted,
      timestamp,
      createdAtIso
    });
  }

  const safeTicket = session.role === 'cliente' ? sanitizarTicketParaCliente(ticket) : ticket;
  return { message: nuevoMensaje, ticket: safeTicket };
}

/**
 * Operación masiva en lote (POST /api/tickets/bulk).
 * Regla: Un agente solo puede modificar tickets asignados a él o sin asignar.
 */
export function procesarOperacionLote(
  session: SessionPayload,
  body: {
    ticketIds: string[];
    action: 'assign' | 'status' | 'resolve';
    statusTarget?: TicketStatus;
    agentName?: string;
  }
): { errorStatus?: number; errorMsg?: string; modifiedCount?: number; modifiedTickets?: Ticket[] } {
  if (session.role === 'cliente') {
    return { errorStatus: 403, errorMsg: 'Clientes no tienen autorización para operaciones en lote' };
  }

  if (!Array.isArray(body.ticketIds) || body.ticketIds.length === 0) {
    return { errorStatus: 400, errorMsg: 'Debe proporcionar al menos un ticketId' };
  }

  const now = new Date();
  const timeFormatted = formatFechaBogota(now, true);
  const timestamp = now.getTime();
  const createdAtIso = now.toISOString();

  let modifiedCount = 0;
  const modifiedTickets: Ticket[] = [];

  for (const id of body.ticketIds) {
    const ticket = SERVER_TICKETS_DATABASE.find(t => t.id === id || t.code === id);
    if (!ticket) continue;

    // Validación agente
    if (session.role === 'agente') {
      const isUnassigned = !ticket.assignedAgent || !ticket.assignedAgent.name;
      const isAssignedToMe = ticket.assignedAgent && ticket.assignedAgent.name.toLowerCase().includes(session.name.split(' ')[0].toLowerCase());
      if (!isUnassigned && !isAssignedToMe) {
        // Saltar tickets asignados a otros agentes
        continue;
      }
    }

    if (body.action === 'assign') {
      const targetAgent = body.agentName || session.name;
      ticket.assignedAgent = {
        name: targetAgent,
        avatar: session.avatar || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80',
        role: session.title || 'Especialista de soporte'
      };
      if (ticket.status === 'Nuevo') {
        ticket.status = 'Asignado';
      }
      ticket.history.push({
        id: `evt-${ticket.id}-${Date.now()}-blk-as`,
        action: 'Asignación en lote',
        detail: `Asignado en lote a ${targetAgent} por ${session.name}`,
        user: session.name,
        time: timeFormatted,
        timestamp,
        createdAtIso
      });
      modifiedCount++;
      modifiedTickets.push(ticket);
    } else if (body.action === 'status' && body.statusTarget) {
      const prevStatus = ticket.status;
      ticket.status = body.statusTarget;
      ticket.history.push({
        id: `evt-${ticket.id}-${Date.now()}-blk-st`,
        action: 'Cambio de estado en lote',
        detail: `Estado cambiado de "${prevStatus}" a "${body.statusTarget}" en lote por ${session.name}`,
        user: session.name,
        time: timeFormatted,
        timestamp,
        createdAtIso
      });
      if (body.statusTarget === 'Resuelto' || body.statusTarget === 'Cerrado') {
        ticket.resolvedAtIso = createdAtIso;
        ticket.resolutionTime = 'Resuelto en SLA';
        ticket.slaFormatted = 'Cumplido';
      }
      modifiedCount++;
      modifiedTickets.push(ticket);
    } else if (body.action === 'resolve') {
      ticket.status = 'Resuelto';
      ticket.resolvedAtIso = createdAtIso;
      ticket.resolutionTime = 'Resuelto en SLA';
      ticket.slaFormatted = 'Cumplido';
      ticket.history.push({
        id: `evt-${ticket.id}-${Date.now()}-blk-res`,
        action: 'Resolución en lote',
        detail: `Ticket resuelto en lote por ${session.name}`,
        user: session.name,
        time: timeFormatted,
        timestamp,
        createdAtIso
      });
      modifiedCount++;
      modifiedTickets.push(ticket);
    }
  }

  return { modifiedCount, modifiedTickets };
}
