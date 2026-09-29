import { Ticket, User, NavigationFilters } from '../types';

export const filterTicketsByNavigation = (
  tickets: Ticket[],
  filters: NavigationFilters,
  currentUser: User | null
): Ticket[] => {
  return tickets.filter(ticket => {
    const isResolvedOrClosed = ticket.status === 'Resuelto' || ticket.status === 'Cerrado';

    // 1. Filtro por Bandeja de Gestión (URL: ?bandeja=activos|mios|sin-asignar|todos)
    if (filters.bandeja === 'activos') {
      if (isResolvedOrClosed) return false;
    } else if (filters.bandeja === 'mios') {
      if (isResolvedOrClosed || !currentUser) return false;
      const userNamePrefix = currentUser.name.split(' ')[0].toLowerCase();
      if (!ticket.assignedAgent || !ticket.assignedAgent.name.toLowerCase().includes(userNamePrefix)) {
        return false;
      }
    } else if (filters.bandeja === 'sin-asignar') {
      if (isResolvedOrClosed) return false;
      if (ticket.assignedAgent && ticket.assignedAgent.name.trim() !== '') {
        return false;
      }
    } else if (filters.bandeja === 'todos') {
      // Todos los tickets, incluidos Resuelto y Cerrado
    }

    // 2. Filtros Rápidos (URL: ?filtro_rapido=urgentes|sla_riesgo|esperando)
    if (filters.filtroRapido === 'urgentes') {
      if (ticket.priority !== 'Crítica') return false;
    } else if (filters.filtroRapido === 'sla_riesgo') {
      if (!ticket.isBreached && ticket.slaRemainingPercent >= 20) return false;
    } else if (filters.filtroRapido === 'esperando') {
      if (ticket.status !== 'En espera del cliente') return false;
    }

    // 3. Filtros Avanzados (Empresa, Agente, Prioridad, Categoría, Estado de SLA)
    if (filters.empresa && ticket.company !== filters.empresa) {
      return false;
    }

    if (filters.agente) {
      if (!ticket.assignedAgent || ticket.assignedAgent.name !== filters.agente) {
        return false;
      }
    }

    if (filters.prioridad && ticket.priority !== filters.prioridad) {
      return false;
    }

    if (filters.categoria && ticket.category !== filters.categoria) {
      return false;
    }

    if (filters.sla) {
      if (filters.sla === 'vencido' && !ticket.isBreached && ticket.slaMinutesRemaining > 0) return false;
      if (filters.sla === 'riesgo' && (ticket.slaRemainingPercent >= 20 || ticket.isBreached)) return false;
      if (filters.sla === 'alerta' && (ticket.slaRemainingPercent < 20 || ticket.slaRemainingPercent > 50)) return false;
      if (filters.sla === 'rango' && ticket.slaRemainingPercent <= 50) return false;
    }

    // 4. Búsqueda local de texto
    if (filters.busqueda) {
      const q = filters.busqueda.toLowerCase();
      const matchCode = ticket.code.toLowerCase().includes(q);
      const matchTitle = ticket.title.toLowerCase().includes(q);
      const matchCompany = ticket.company.toLowerCase().includes(q);
      const matchRequester = ticket.requesterName.toLowerCase().includes(q);
      if (!matchCode && !matchTitle && !matchCompany && !matchRequester) return false;
    }

    return true;
  });
};

export const getBandejaTitle = (bandeja: NavigationFilters['bandeja']): string => {
  switch (bandeja) {
    case 'mios':
      return 'Mis tickets';
    case 'sin-asignar':
      return 'Sin asignar';
    case 'todos':
      return 'Todos los tickets';
    case 'activos':
    default:
      return 'Bandeja de tickets';
  }
};
