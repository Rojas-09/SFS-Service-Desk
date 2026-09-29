import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import { Ticket, User, TicketStatus, Announcement, TicketHistoryEvent } from '../types';
import { INITIAL_TICKETS, INITIAL_USERS, INITIAL_ANNOUNCEMENTS } from '../data/mockData';

interface MoveTicketResult {
  success: boolean;
  error?: string;
  ticket?: Ticket;
  previousStatus?: TicketStatus;
  previousAgent?: Ticket['assignedAgent'];
}

interface ToastInfo {
  id: string;
  message: string;
  type?: 'success' | 'error' | 'info';
  undoAction?: () => void;
  undoLabel?: string;
}

interface TicketsContextValue {
  tickets: Ticket[];
  currentUser: User | null;
  announcements: Announcement[];
  setCurrentUser: (user: User | null) => void;
  isAuthLoaded: boolean;
  logout: () => Promise<void>;
  counts: {
    activos: number;
    mios: number;
    sinAsignar: number;
    todos: number;
    announcements: number;
    companies: number;
  };
  moveTicket: (
    ticketId: string,
    targetStatus: TicketStatus,
    options?: { assignedAgentName?: string }
  ) => MoveTicketResult;
  undoMove: (
    ticketId: string,
    previousStatus: TicketStatus,
    previousAgent?: Ticket['assignedAgent']
  ) => void;
  takeTicket: (ticketId: string) => void;
  sendMessage: (ticketId: string, content: string, isInternal: boolean) => void;
  updateStatus: (ticketId: string, newStatus: TicketStatus) => void;
  reassignAgent: (ticketId: string, newAgentName: string) => void;
  bulkResolve: (ticketIds: string[]) => void;
  bulkAssign: (ticketIds: string[]) => void;
  bulkChangeStatus: (ticketIds: string[], newStatus: TicketStatus) => void;
  createTicket: (newTicket: Ticket) => void;
  addAnnouncement: (announcement: Announcement) => void;
  toast: ToastInfo | null;
  showToast: (
    message: string,
    options?: { type?: 'success' | 'error' | 'info'; undoAction?: () => void; undoLabel?: string }
  ) => void;
  clearToast: () => void;
}

const TicketsContext = createContext<TicketsContextValue | null>(null);

export const TicketsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [allTickets, setAllTickets] = useState<Ticket[]>(INITIAL_TICKETS);
  const [announcements, setAnnouncements] = useState<Announcement[]>(INITIAL_ANNOUNCEMENTS);
  const [currentUser, setCurrentUser] = useState<User | null>(INITIAL_USERS.supervisor);
  const [isAuthLoaded, setIsAuthLoaded] = useState<boolean>(true);
  const [toast, setToast] = useState<ToastInfo | null>(null);

  // Intentar sincronizar sesión real con el backend en montaje
  useEffect(() => {
    async function checkBackendSession() {
      try {
        const res = await fetch('/api/auth/session');
        if (res.ok) {
          const data = await res.json();
          if (data && data.user) {
            setCurrentUser(data.user);
          }
        }
      } catch {
        // En entorno dev puro, mantener usuario actual
      } finally {
        setIsAuthLoaded(true);
      }
    }
    checkBackendSession();
  }, []);

  const showToast = (
    message: string,
    options?: { type?: 'success' | 'error' | 'info'; undoAction?: () => void; undoLabel?: string }
  ) => {
    const id = `toast-${Date.now()}`;
    setToast({
      id,
      message,
      type: options?.type || 'info',
      undoAction: options?.undoAction,
      undoLabel: options?.undoLabel || 'Deshacer'
    });

    setTimeout(() => {
      setToast(current => (current && current.id === id ? null : current));
    }, 5000);
  };

  const clearToast = () => setToast(null);

  // Cerrar sesión
  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // Ignorar error de red en logout
    }
    setCurrentUser(null);
    showToast('Sesión cerrada', { type: 'info' });
  };

  // Requirement 5: Filtrado estricto en el servidor / store
  // Un cliente solo obtiene tickets de SU empresa y NUNCA ve mensajes con interno = true
  const visibleTickets = useMemo(() => {
    if (!currentUser) return [];

    if (currentUser.role === 'cliente') {
      const company = currentUser.company;
      return allTickets
        .filter(t => t.company === company || t.requesterEmail === currentUser.email)
        .map(t => ({
          ...t,
          messages: t.messages.filter(m => !m.isInternal)
        }));
    }

    // Agentes, supervisores y administradores ven tickets del sistema
    return allTickets;
  }, [allTickets, currentUser]);

  // Contadores calculados sin contar Resuelto ni Cerrado como activos
  const counts = useMemo(() => {
    if (!currentUser) {
      return { activos: 0, mios: 0, sinAsignar: 0, todos: 0, announcements: 0, companies: 6 };
    }

    const activeTickets = visibleTickets.filter(
      t => t.status !== 'Resuelto' && t.status !== 'Cerrado'
    );
    const myActive = activeTickets.filter(
      t =>
        t.assignedAgent &&
        t.assignedAgent.name.toLowerCase().includes(currentUser.name.split(' ')[0].toLowerCase())
    );
    const unassignedActive = activeTickets.filter(t => !t.assignedAgent || !t.assignedAgent.name);

    return {
      activos: activeTickets.length,
      mios: myActive.length,
      sinAsignar: unassignedActive.length,
      todos: visibleTickets.length,
      announcements: announcements.length,
      companies: 6
    };
  }, [visibleTickets, announcements.length, currentUser]);

  // Mover ticket con reglas de autorización y auditoría
  const moveTicket = (
    ticketId: string,
    targetStatus: TicketStatus,
    options?: { assignedAgentName?: string }
  ): MoveTicketResult => {
    if (!currentUser) return { success: false, error: 'No autenticado' };

    const currentTicket = allTickets.find(t => t.id === ticketId);
    if (!currentTicket) {
      return { success: false, error: 'Ticket no encontrado' };
    }

    if (currentTicket.status === targetStatus) {
      return { success: true, ticket: currentTicket };
    }

    // Regla 11: Un agente solo mueve tickets propios o sin asignar
    const isOwner =
      currentTicket.assignedAgent &&
      currentTicket.assignedAgent.name
        .toLowerCase()
        .includes(currentUser.name.split(' ')[0].toLowerCase());
    const isUnassigned = !currentTicket.assignedAgent || !currentTicket.assignedAgent.name;
    const canMove =
      currentUser.role === 'admin' ||
      currentUser.role === 'supervisor' ||
      isOwner ||
      isUnassigned;

    if (!canMove) {
      showToast('Solo puedes gestionar tus propios tickets o tickets sin asignar', {
        type: 'error'
      });
      return { success: false, error: 'Permiso denegado' };
    }

    const previousStatus = currentTicket.status;
    const previousAgent = currentTicket.assignedAgent;
    let nextAgent = currentTicket.assignedAgent;

    // Regla 11: En Nuevo se quita el agente
    if (targetStatus === 'Nuevo') {
      nextAgent = undefined;
    } else if (
      (targetStatus === 'Asignado' ||
        targetStatus === 'En progreso' ||
        targetStatus === 'En espera del cliente') &&
      !nextAgent
    ) {
      // Regla 11: Autoasignación de agente o selección por supervisor/admin
      if (options?.assignedAgentName) {
        nextAgent = {
          name: options.assignedAgentName,
          avatar:
            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
          role: 'Especialista de soporte'
        };
      } else {
        nextAgent = {
          name: currentUser.name,
          avatar: currentUser.avatar,
          role: currentUser.title
        };
      }
    }

    const newHistoryEvent: TicketHistoryEvent = {
      id: `h-${Date.now()}`,
      action: `Cambio de estado a ${targetStatus}`,
      detail: `Movido de ${previousStatus} a ${targetStatus}${
        nextAgent ? ` (Agente: ${nextAgent.name})` : ''
      }`,
      user: currentUser.name,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      timestamp: Date.now()
    };

    const updatedTicket: Ticket = {
      ...currentTicket,
      status: targetStatus,
      assignedAgent: nextAgent,
      resolutionTime:
        targetStatus === 'Resuelto' ? 'Resuelto ahora' : currentTicket.resolutionTime,
      history: [...currentTicket.history, newHistoryEvent]
    };

    setAllTickets(prev => prev.map(t => (t.id === ticketId ? updatedTicket : t)));

    showToast(`Ticket ${currentTicket.code} movido a ${targetStatus}`, {
      type: 'success',
      undoAction: () => {
        undoMove(ticketId, previousStatus, previousAgent);
      },
      undoLabel: 'Deshacer'
    });

    return {
      success: true,
      ticket: updatedTicket,
      previousStatus,
      previousAgent
    };
  };

  const undoMove = (
    ticketId: string,
    previousStatus: TicketStatus,
    previousAgent?: Ticket['assignedAgent']
  ) => {
    if (!currentUser) return;
    setAllTickets(prev =>
      prev.map(t => {
        if (t.id === ticketId) {
          const undoEvent: TicketHistoryEvent = {
            id: `h-undo-${Date.now()}`,
            action: 'Acción deshecha',
            detail: `Restablecido a estado ${previousStatus}`,
            user: currentUser.name,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            timestamp: Date.now()
          };
          return {
            ...t,
            status: previousStatus,
            assignedAgent: previousAgent,
            history: [...t.history, undoEvent]
          };
        }
        return t;
      })
    );
    showToast('Movimiento deshecho para el ticket', { type: 'info' });
  };

  const takeTicket = (ticketId: string) => {
    if (!currentUser) return;
    setAllTickets(prev =>
      prev.map(t => {
        if (t.id === ticketId) {
          return {
            ...t,
            status: 'En progreso' as TicketStatus,
            assignedAgent: {
              name: currentUser.name,
              avatar: currentUser.avatar,
              role: currentUser.title
            },
            history: [
              ...t.history,
              {
                id: `h-${Date.now()}`,
                action: 'Ticket asignado',
                detail: `Tomado y autoasignado por ${currentUser.name}`,
                user: currentUser.name,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                timestamp: Date.now()
              }
            ]
          };
        }
        return t;
      })
    );
    showToast(`Ticket asignado a ${currentUser.name}`);
  };

  const sendMessage = (ticketId: string, content: string, isInternal: boolean) => {
    if (!currentUser) return;
    setAllTickets(prev =>
      prev.map(t => {
        if (t.id === ticketId) {
          const newMsg = {
            id: `msg-${Date.now()}`,
            senderName: isInternal
              ? `${currentUser.name} (SFS)`
              : currentUser.role === 'cliente'
              ? `${currentUser.name} (Cliente)`
              : `${currentUser.name} (SFS Soporte)`,
            senderRole:
              currentUser.role === 'cliente' ? ('cliente' as const) : ('soporte' as const),
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            timestamp: Date.now(),
            content,
            isInternal
          };

          const newHistory: TicketHistoryEvent = {
            id: `h-${Date.now()}`,
            action: isInternal ? 'Nota interna guardada' : 'Respuesta al cliente',
            detail: isInternal ? 'Nota privada visible solo para SFS' : 'Mensaje público emitido',
            user: currentUser.name,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            timestamp: Date.now()
          };

          return {
            ...t,
            messages: [...t.messages, newMsg],
            history: [...t.history, newHistory]
          };
        }
        return t;
      })
    );
    showToast(isInternal ? 'Nota interna guardada' : 'Respuesta enviada al cliente');
  };

  const updateStatus = (ticketId: string, newStatus: TicketStatus) => {
    moveTicket(ticketId, newStatus);
  };

  const reassignAgent = (ticketId: string, newAgentName: string) => {
    if (!currentUser) return;
    setAllTickets(prev =>
      prev.map(t => {
        if (t.id === ticketId) {
          return {
            ...t,
            assignedAgent: {
              name: newAgentName,
              avatar:
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
              role: 'Especialista de soporte'
            },
            history: [
              ...t.history,
              {
                id: `h-${Date.now()}`,
                action: 'Reasignación',
                detail: `Asignado a ${newAgentName}`,
                user: currentUser.name,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                timestamp: Date.now()
              }
            ]
          };
        }
        return t;
      })
    );
    showToast(`Ticket reasignado a: ${newAgentName}`);
  };

  const bulkResolve = (ticketIds: string[]) => {
    if (!currentUser) return;
    setAllTickets(prev =>
      prev.map(t => {
        if (ticketIds.includes(t.id)) {
          return {
            ...t,
            status: 'Resuelto' as TicketStatus,
            resolutionTime: 'Resuelto hoy',
            history: [
              ...t.history,
              {
                id: `h-${Date.now()}`,
                action: 'Resuelto por lote',
                detail: 'Marcado como resuelto en operación masiva',
                user: currentUser.name,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                timestamp: Date.now()
              }
            ]
          };
        }
        return t;
      })
    );
    showToast(
      `${ticketIds.length} ${ticketIds.length === 1 ? 'ticket resuelto' : 'tickets resueltos'}`
    );
  };

  const bulkAssign = (ticketIds: string[]) => {
    if (!currentUser) return;
    setAllTickets(prev =>
      prev.map(t => {
        if (ticketIds.includes(t.id)) {
          return {
            ...t,
            status: 'Asignado' as TicketStatus,
            assignedAgent: {
              name: currentUser.name,
              avatar: currentUser.avatar,
              role: currentUser.title
            },
            history: [
              ...t.history,
              {
                id: `h-${Date.now()}`,
                action: 'Asignado por lote',
                detail: `Asignado a ${currentUser.name}`,
                user: currentUser.name,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                timestamp: Date.now()
              }
            ]
          };
        }
        return t;
      })
    );
    showToast(
      `${ticketIds.length} ${ticketIds.length === 1 ? 'ticket asignado' : 'tickets asignados'}`
    );
  };

  const bulkChangeStatus = (ticketIds: string[], newStatus: TicketStatus) => {
    if (!currentUser) return;
    setAllTickets(prev =>
      prev.map(t => {
        if (ticketIds.includes(t.id)) {
          return {
            ...t,
            status: newStatus,
            history: [
              ...t.history,
              {
                id: `h-${Date.now()}`,
                action: 'Cambio de estado por lote',
                detail: `Actualizado a "${newStatus}"`,
                user: currentUser.name,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                timestamp: Date.now()
              }
            ]
          };
        }
        return t;
      })
    );
    showToast(`Se cambió el estado a ${newStatus} en ${ticketIds.length} tickets`);
  };

  const createTicket = (newTicket: Ticket) => {
    setAllTickets(prev => [newTicket, ...prev]);
    showToast(`Ticket ${newTicket.code} creado exitosamente`);
  };

  const addAnnouncement = (newAnnouncement: Announcement) => {
    setAnnouncements(prev => [newAnnouncement, ...prev]);
    showToast('Comunicado publicado exitosamente');
  };

  return (
    <TicketsContext.Provider
      value={{
        tickets: visibleTickets,
        currentUser,
        announcements,
        setCurrentUser,
        isAuthLoaded,
        logout,
        counts,
        moveTicket,
        undoMove,
        takeTicket,
        sendMessage,
        updateStatus,
        reassignAgent,
        bulkResolve,
        bulkAssign,
        bulkChangeStatus,
        createTicket,
        addAnnouncement,
        toast,
        showToast,
        clearToast
      }}
    >
      {children}
    </TicketsContext.Provider>
  );
};

export const useTickets = (): TicketsContextValue => {
  const context = useContext(TicketsContext);
  if (!context) {
    throw new Error('useTickets debe ser utilizado dentro de un TicketsProvider');
  }
  return context;
};
