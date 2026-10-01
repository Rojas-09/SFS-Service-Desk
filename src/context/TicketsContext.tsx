import React, { createContext, useContext, useState, useMemo, useEffect, useCallback } from 'react';
import { Ticket, User, TicketStatus, Announcement, TicketHistoryEvent, KPIStats } from '../types';
import { INITIAL_ANNOUNCEMENTS, COMPANIES_LIST } from '../data/mockData';
import { DEMO_TICKETS } from '../data/demoTickets';
import { calcularKPIs } from '../utils/kpi';
import { formatFechaBogota } from '../utils/fechas';

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
  kpis: KPIStats;
  moveTicket: (
    ticketId: string,
    targetStatus: TicketStatus,
    options?: { assignedAgentName?: string }
  ) => Promise<MoveTicketResult>;
  undoMove: (
    ticketId: string,
    previousStatus: TicketStatus,
    previousAgent?: Ticket['assignedAgent']
  ) => Promise<void>;
  takeTicket: (ticketId: string) => Promise<void>;
  sendMessage: (ticketId: string, content: string, isInternal: boolean) => Promise<void>;
  updateStatus: (ticketId: string, newStatus: TicketStatus) => Promise<void>;
  reassignAgent: (ticketId: string, newAgentName: string) => Promise<void>;
  bulkResolve: (ticketIds: string[]) => Promise<void>;
  bulkAssign: (ticketIds: string[]) => Promise<void>;
  bulkChangeStatus: (ticketIds: string[], newStatus: TicketStatus) => Promise<void>;
  createTicket: (newTicket: Ticket) => Promise<Ticket | null>;
  addAnnouncement: (announcement: Announcement) => void;
  toast: ToastInfo | null;
  showToast: (
    message: string,
    options?: { type?: 'success' | 'error' | 'info'; undoAction?: () => void; undoLabel?: string }
  ) => void;
  clearToast: () => void;
  reloadTickets: () => Promise<void>;
}

const TicketsContext = createContext<TicketsContextValue | null>(null);

export const TicketsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [allTickets, setAllTickets] = useState<Ticket[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>(INITIAL_ANNOUNCEMENTS);
  const [currentUser, setCurrentUserState] = useState<User | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const cached = localStorage.getItem('sfs_user');
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });
  const [isAuthLoaded, setIsAuthLoaded] = useState<boolean>(false);
  const [toast, setToast] = useState<ToastInfo | null>(null);

  const showToast = useCallback((
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
  }, []);

  const clearToast = useCallback(() => setToast(null), []);

  const getAuthHeaders = useCallback((): HeadersInit => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('sfs_token') : null;
    const h: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    if (token) h['Authorization'] = `Bearer ${token}`;
    return h;
  }, []);

  const setCurrentUser = useCallback((user: User | null) => {
    setCurrentUserState(user);
    if (typeof window !== 'undefined') {
      try {
        if (user) {
          localStorage.setItem('sfs_user', JSON.stringify(user));
        } else {
          localStorage.removeItem('sfs_user');
        }
      } catch {}
    }
  }, []);

  // Intentar sincronizar sesión real con el backend en montaje
  useEffect(() => {
    async function checkBackendSession() {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('sfs_token') : null;
        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch('/api/auth/session', { headers, credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          if (data && data.user) {
            setCurrentUserState(data.user);
            try {
              localStorage.setItem('sfs_user', JSON.stringify(data.user));
            } catch {}
          } else {
            setCurrentUserState(null);
            try {
              localStorage.removeItem('sfs_user');
              localStorage.removeItem('sfs_token');
            } catch {}
          }
        } else if (res.status === 401) {
          if (!import.meta.env.DEV) {
            setCurrentUserState(null);
            try {
              localStorage.removeItem('sfs_user');
              localStorage.removeItem('sfs_token');
            } catch {}
          } else {
            // En modo desarrollo, auto-autenticar con usuario guardado o demo por defecto
            try {
              const cached = typeof window !== 'undefined' ? localStorage.getItem('sfs_user') : null;
              const u = cached ? JSON.parse(cached) : null;
              const emailToLogin = u?.email || 'agente@sfs.co';
              const loginRes = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: emailToLogin, password: 'SFS2026!' }),
                credentials: 'include'
              });
              if (loginRes.ok) {
                const loginData = await loginRes.json();
                if (loginData.token) {
                  localStorage.setItem('sfs_token', loginData.token);
                }
                if (loginData.user) {
                  setCurrentUserState(loginData.user);
                  localStorage.setItem('sfs_user', JSON.stringify(loginData.user));
                }
              }
            } catch {}
          }
        }
      } catch {
        // En entorno dev puro
      } finally {
        setIsAuthLoaded(true);
      }
    }
    checkBackendSession();
  }, []);

  // Carga de tickets desde la API (GET /api/tickets) tras el login (Requirement 3)
  const reloadTickets = useCallback(async () => {
    if (!currentUser) {
      setAllTickets([]);
      return;
    }
    const isDemoUser = currentUser.id.startsWith('demo-');

    const useDemoTickets = () => {
      if (isDemoUser) setAllTickets(DEMO_TICKETS);
    };

    try {
      const getHeaders = () => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('sfs_token') : null;
        const h: Record<string, string> = {};
        if (token) h['Authorization'] = `Bearer ${token}`;
        return h;
      };

      let res = await fetch('/api/tickets', {
        headers: getHeaders(),
        credentials: 'include'
      });

      // Auto-autenticación en modo desarrollo si 401 (evita pantalla vacía por cookie faltante)
      if (res.status === 401 && Boolean(import.meta.env.DEV)) {
        try {
          const emailToLogin = currentUser.email || 'agente@sfs.co';
          const loginRes = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: emailToLogin, password: 'SFS2026!' }),
            credentials: 'include'
          });
          if (loginRes.ok) {
            const loginData = await loginRes.json();
            if (loginData.token) {
              localStorage.setItem('sfs_token', loginData.token);
            }
            res = await fetch('/api/tickets', {
              headers: getHeaders(),
              credentials: 'include'
            });
          }
        } catch {}
      }

      if (res.status === 403) {
        const errData = await res.json().catch(() => ({}));
        if (errData && errData.code === 'MUST_CHANGE_PASSWORD') {
          window.history.pushState({}, '', '/cambiar-contrasena');
          window.dispatchEvent(new PopStateEvent('popstate'));
          return;
        }
      }
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.tickets)) {
          setAllTickets(data.tickets);
        }
      } else {
        useDemoTickets();
      }
    } catch {
      useDemoTickets();
    }
  }, [currentUser]);

  useEffect(() => {
    reloadTickets();
  }, [reloadTickets]);

  // Cerrar sesión
  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch {
      // Ignorar error de red en logout
    }
    try {
      localStorage.removeItem('sfs_token');
      localStorage.removeItem('sfs_user');
    } catch {}
    setCurrentUser(null);
    setAllTickets([]);
    showToast('Sesión cerrada', { type: 'info' });
  };

  // Filtrado de seguridad en el frontend
  // Un cliente solo obtiene tickets de su empresa y no ve mensajes internos
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

    return allTickets;
  }, [allTickets, currentUser]);

  // Contadores dinámicos calculados desde los tickets
  const counts = useMemo(() => {
    if (!currentUser) {
      return { activos: 0, mios: 0, sinAsignar: 0, todos: 0, announcements: 0, companies: COMPANIES_LIST.length };
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
      companies: COMPANIES_LIST.length
    };
  }, [visibleTickets, announcements.length, currentUser]);

  // KPIs dinámicos calculados exclusivamente desde los tickets reales (Requirement 8)
  const kpis = useMemo(() => {
    return calcularKPIs(visibleTickets);
  }, [visibleTickets]);

  // ================= MUTACIONES CON ACTUALIZACIÓN OPTIMISTA Y REVERSIÓN =================

  // 1. Mover ticket / cambiar estado
  const moveTicket = async (
    ticketId: string,
    targetStatus: TicketStatus,
    options?: { assignedAgentName?: string }
  ): Promise<MoveTicketResult> => {
    if (!currentUser) return { success: false, error: 'No autenticado' };

    const currentTicket = allTickets.find(t => t.id === ticketId);
    if (!currentTicket) {
      return { success: false, error: 'Ticket no encontrado' };
    }

    if (currentTicket.status === targetStatus) {
      return { success: true, ticket: currentTicket };
    }

    // Validación cliente
    if (currentUser.role === 'cliente') {
      showToast('Los clientes no pueden cambiar el estado del ticket', { type: 'error' });
      return { success: false, error: 'Permiso denegado' };
    }

    // Validación agente
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
      showToast('Solo puedes gestionar tus propios tickets o tickets sin asignar', { type: 'error' });
      return { success: false, error: 'Permiso denegado' };
    }

    const previousStatus = currentTicket.status;
    const previousAgent = currentTicket.assignedAgent;
    const snapshot = [...allTickets];

    let nextAgent = currentTicket.assignedAgent;
    if (targetStatus === 'Nuevo') {
      nextAgent = undefined;
    } else if (
      (targetStatus === 'Asignado' ||
        targetStatus === 'En progreso' ||
        targetStatus === 'En espera del cliente') &&
      !nextAgent
    ) {
      if (options?.assignedAgentName) {
        nextAgent = {
          name: options.assignedAgentName,
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
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
      detail: `Movido de ${previousStatus} a ${targetStatus}${nextAgent ? ` (Agente: ${nextAgent.name})` : ''}`,
      user: currentUser.name,
      time: formatFechaBogota(new Date(), true),
      timestamp: Date.now()
    };

    const updatedTicket: Ticket = {
      ...currentTicket,
      status: targetStatus,
      assignedAgent: nextAgent,
      resolutionTime: targetStatus === 'Resuelto' ? 'Resuelto en SLA' : currentTicket.resolutionTime,
      history: [...currentTicket.history, newHistoryEvent]
    };

    // 1. Optimistic Update
    setAllTickets(prev => prev.map(t => (t.id === ticketId ? updatedTicket : t)));

    showToast(`Ticket ${currentTicket.code} movido a ${targetStatus}`, {
      type: 'success',
      undoAction: () => {
        undoMove(ticketId, previousStatus, previousAgent);
      },
      undoLabel: 'Deshacer'
    });

    // 2. Fetch a la API
    try {
      const res = await fetch(`/api/tickets/${ticketId}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({
          status: targetStatus,
          assignedAgent: nextAgent
        })
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        // Reversión
        setAllTickets(snapshot);
        showToast(err.error || 'Error al actualizar el ticket en el servidor', { type: 'error' });
        return { success: false, error: err.error || 'Fallo en el servidor' };
      }

      const data = await res.json();
      if (data && data.ticket) {
        setAllTickets(prev => prev.map(t => (t.id === ticketId ? data.ticket : t)));
      }
    } catch {
      // Reversión por error de red
      setAllTickets(snapshot);
      showToast('Error de conexión al actualizar el ticket. Cambio revertido.', { type: 'error' });
      return { success: false, error: 'Error de red' };
    }

    return {
      success: true,
      ticket: updatedTicket,
      previousStatus,
      previousAgent
    };
  };

  const undoMove = async (
    ticketId: string,
    previousStatus: TicketStatus,
    previousAgent?: Ticket['assignedAgent']
  ) => {
    if (!currentUser) return;
    const snapshot = [...allTickets];

    setAllTickets(prev =>
      prev.map(t => {
        if (t.id === ticketId) {
          const undoEvent: TicketHistoryEvent = {
            id: `h-undo-${Date.now()}`,
            action: 'Acción deshecha',
            detail: `Restablecido a estado ${previousStatus}`,
            user: currentUser.name,
            time: formatFechaBogota(new Date(), true),
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

    try {
      const res = await fetch(`/api/tickets/${ticketId}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({
          status: previousStatus,
          assignedAgent: previousAgent
        })
      });
      if (!res.ok) {
        setAllTickets(snapshot);
        showToast('No se pudo revertir el ticket en el servidor', { type: 'error' });
      }
    } catch {
      setAllTickets(snapshot);
      showToast('Error de conexión al deshacer', { type: 'error' });
    }
  };

  // 2. Tomar ticket (auto-asignar y poner En progreso)
  const takeTicket = async (ticketId: string) => {
    if (!currentUser) return;
    const currentTicket = allTickets.find(t => t.id === ticketId);
    if (!currentTicket) return;

    const snapshot = [...allTickets];
    const newAgent = {
      name: currentUser.name,
      avatar: currentUser.avatar,
      role: currentUser.title
    };

    setAllTickets(prev =>
      prev.map(t => {
        if (t.id === ticketId) {
          return {
            ...t,
            status: 'En progreso' as TicketStatus,
            assignedAgent: newAgent,
            history: [
              ...t.history,
              {
                id: `h-${Date.now()}`,
                action: 'Ticket asignado',
                detail: `Tomado y autoasignado por ${currentUser.name}`,
                user: currentUser.name,
                time: formatFechaBogota(new Date(), true),
                timestamp: Date.now()
              }
            ]
          };
        }
        return t;
      })
    );

    showToast(`Ticket asignado a ${currentUser.name}`, { type: 'success' });

    try {
      const res = await fetch(`/api/tickets/${ticketId}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({
          status: 'En progreso',
          assignedAgent: newAgent
        })
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setAllTickets(snapshot);
        showToast(err.error || 'No fue posible autoasignar el ticket', { type: 'error' });
      }
    } catch {
      setAllTickets(snapshot);
      showToast('Error de conexión al asignar ticket. Cambio revertido.', { type: 'error' });
    }
  };

  // 3. Enviar mensaje o nota interna
  const sendMessage = async (ticketId: string, content: string, isInternal: boolean) => {
    if (!currentUser) return;
    const currentTicket = allTickets.find(t => t.id === ticketId);
    if (!currentTicket) return;

    if (currentUser.role === 'cliente' && isInternal) {
      showToast('Los clientes no pueden enviar notas internas', { type: 'error' });
      return;
    }

    const snapshot = [...allTickets];
    const now = new Date();
    const timeFormatted = formatFechaBogota(now, true);

    const newMsg = {
      id: `msg-${Date.now()}`,
      senderName: isInternal
        ? `${currentUser.name} (SFS)`
        : currentUser.role === 'cliente'
        ? `${currentUser.name} (Cliente)`
        : `${currentUser.name} (SFS Soporte)`,
      senderRole: currentUser.role === 'cliente' ? ('cliente' as const) : ('soporte' as const),
      time: timeFormatted,
      timestamp: now.getTime(),
      content,
      isInternal
    };

    const newHistory: TicketHistoryEvent = {
      id: `h-${Date.now()}`,
      action: isInternal ? 'Nota interna guardada' : 'Respuesta al cliente',
      detail: isInternal ? 'Nota privada visible solo para SFS' : 'Mensaje público emitido',
      user: currentUser.name,
      time: timeFormatted,
      timestamp: now.getTime()
    };

    setAllTickets(prev =>
      prev.map(t => {
        if (t.id === ticketId) {
          return {
            ...t,
            messages: [...t.messages, newMsg],
            history: [...t.history, newHistory]
          };
        }
        return t;
      })
    );

    showToast(isInternal ? 'Nota interna guardada' : 'Respuesta enviada al cliente', { type: 'success' });

    try {
      const res = await fetch(`/api/tickets/${ticketId}/messages`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({ content, isInternal })
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setAllTickets(snapshot);
        showToast(err.error || 'Error al enviar el mensaje en el servidor', { type: 'error' });
      } else {
        const data = await res.json();
        if (data && data.ticket) {
          setAllTickets(prev => prev.map(t => (t.id === ticketId ? data.ticket : t)));
        }
      }
    } catch {
      setAllTickets(snapshot);
      showToast('Error de conexión al enviar el mensaje. Revertido.', { type: 'error' });
    }
  };

  const updateStatus = async (ticketId: string, newStatus: TicketStatus) => {
    await moveTicket(ticketId, newStatus);
  };

  // 4. Reasignar agente
  const reassignAgent = async (ticketId: string, newAgentName: string) => {
    if (!currentUser) return;
    const currentTicket = allTickets.find(t => t.id === ticketId);
    if (!currentTicket) return;

    const snapshot = [...allTickets];
    const newAgent = {
      name: newAgentName,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
      role: 'Especialista de soporte'
    };

    setAllTickets(prev =>
      prev.map(t => {
        if (t.id === ticketId) {
          return {
            ...t,
            assignedAgent: newAgent,
            history: [
              ...t.history,
              {
                id: `h-${Date.now()}`,
                action: 'Reasignación',
                detail: `Asignado a ${newAgentName}`,
                user: currentUser.name,
                time: formatFechaBogota(new Date(), true),
                timestamp: Date.now()
              }
            ]
          };
        }
        return t;
      })
    );

    showToast(`Ticket reasignado a: ${newAgentName}`, { type: 'success' });

    try {
      const res = await fetch(`/api/tickets/${ticketId}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({ assignedAgent: newAgent })
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setAllTickets(snapshot);
        showToast(err.error || 'No fue posible reasignar el agente en el servidor', { type: 'error' });
      }
    } catch {
      setAllTickets(snapshot);
      showToast('Error de conexión al reasignar agente. Revertido.', { type: 'error' });
    }
  };

  // 5. Operaciones en lote
  const bulkResolve = async (ticketIds: string[]) => {
    if (!currentUser || ticketIds.length === 0) return;
    const snapshot = [...allTickets];

    setAllTickets(prev =>
      prev.map(t => {
        if (ticketIds.includes(t.id)) {
          return {
            ...t,
            status: 'Resuelto' as TicketStatus,
            resolutionTime: 'Resuelto en SLA',
            history: [
              ...t.history,
              {
                id: `h-${Date.now()}`,
                action: 'Resuelto por lote',
                detail: 'Marcado como resuelto en operación masiva',
                user: currentUser.name,
                time: formatFechaBogota(new Date(), true),
                timestamp: Date.now()
              }
            ]
          };
        }
        return t;
      })
    );

    showToast(
      `${ticketIds.length} ${ticketIds.length === 1 ? 'ticket resuelto' : 'tickets resueltos'}`,
      { type: 'success' }
    );

    try {
      const res = await fetch('/api/tickets/bulk', {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({
          ticketIds,
          action: 'resolve'
        })
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setAllTickets(snapshot);
        showToast(err.error || 'Error al resolver tickets en lote', { type: 'error' });
      }
    } catch {
      setAllTickets(snapshot);
      showToast('Error de conexión en operación por lote. Revertido.', { type: 'error' });
    }
  };

  const bulkAssign = async (ticketIds: string[]) => {
    if (!currentUser || ticketIds.length === 0) return;
    const snapshot = [...allTickets];

    const agentObj = {
      name: currentUser.name,
      avatar: currentUser.avatar,
      role: currentUser.title
    };

    setAllTickets(prev =>
      prev.map(t => {
        if (ticketIds.includes(t.id)) {
          return {
            ...t,
            status: (t.status === 'Nuevo' ? 'Asignado' : t.status) as TicketStatus,
            assignedAgent: agentObj,
            history: [
              ...t.history,
              {
                id: `h-${Date.now()}`,
                action: 'Asignado por lote',
                detail: `Asignado a ${currentUser.name}`,
                user: currentUser.name,
                time: formatFechaBogota(new Date(), true),
                timestamp: Date.now()
              }
            ]
          };
        }
        return t;
      })
    );

    showToast(
      `${ticketIds.length} ${ticketIds.length === 1 ? 'ticket asignado' : 'tickets asignados'}`,
      { type: 'success' }
    );

    try {
      const res = await fetch('/api/tickets/bulk', {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({
          ticketIds,
          action: 'assign',
          agentName: currentUser.name
        })
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setAllTickets(snapshot);
        showToast(err.error || 'Error al asignar tickets en lote', { type: 'error' });
      }
    } catch {
      setAllTickets(snapshot);
      showToast('Error de red en asignación por lote. Revertido.', { type: 'error' });
    }
  };

  const bulkChangeStatus = async (ticketIds: string[], newStatus: TicketStatus) => {
    if (!currentUser || ticketIds.length === 0) return;
    const snapshot = [...allTickets];

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
                time: formatFechaBogota(new Date(), true),
                timestamp: Date.now()
              }
            ]
          };
        }
        return t;
      })
    );

    showToast(`Se cambió el estado a ${newStatus} en ${ticketIds.length} tickets`, { type: 'success' });

    try {
      const res = await fetch('/api/tickets/bulk', {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({
          ticketIds,
          action: 'status',
          statusTarget: newStatus
        })
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setAllTickets(snapshot);
        showToast(err.error || 'Error al cambiar estado por lote', { type: 'error' });
      }
    } catch {
      setAllTickets(snapshot);
      showToast('Error de red en cambio de estado por lote. Revertido.', { type: 'error' });
    }
  };

  // 6. Crear ticket (POST /api/tickets)
  const createTicket = async (newTicket: Ticket): Promise<Ticket | null> => {
    const snapshot = [...allTickets];
    // Optimistic Update
    setAllTickets(prev => [newTicket, ...prev]);
    showToast(`Ticket ${newTicket.code} creado exitosamente`, { type: 'success' });

    try {
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({
          title: newTicket.title,
          description: newTicket.description,
          company: newTicket.company,
          category: newTicket.category,
          module: newTicket.module,
          priority: newTicket.priority,
          tags: newTicket.tags,
          requesterName: newTicket.requesterName,
          requesterEmail: newTicket.requesterEmail,
          requesterPhone: newTicket.requesterPhone,
          requesterTitle: newTicket.requesterTitle
        })
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setAllTickets(snapshot);
        showToast(err.error || 'Error al registrar el ticket en el servidor', { type: 'error' });
        return null;
      }

      const data = await res.json();
      if (data && data.ticket) {
        // Reemplazar el optimista con el confirmado por el servidor
        setAllTickets(prev => [data.ticket, ...prev.filter(t => t.id !== newTicket.id)]);
        return data.ticket;
      }
      return newTicket;
    } catch {
      setAllTickets(snapshot);
      showToast('Error de red al crear el ticket. Revertido.', { type: 'error' });
      return null;
    }
  };

  const addAnnouncement = (newAnnouncement: Announcement) => {
    setAnnouncements(prev => [newAnnouncement, ...prev]);
    showToast('Comunicado publicado exitosamente', { type: 'success' });
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
        kpis,
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
        clearToast,
        reloadTickets
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
