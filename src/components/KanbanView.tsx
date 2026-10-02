import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  pointerWithin,
  useDraggable,
  useDroppable,
  DragStartEvent,
  DragEndEvent
} from '@dnd-kit/core';
import { Ticket, TicketStatus, NavigationFilters, VistaType, Priority } from '../types';
import { useTickets } from '../context/TicketsContext';
import { filterTicketsByNavigation, getBandejaTitle } from '../utils/filterTickets';
import { COMPANIES_LIST, AGENTS_LIST, CATEGORIES_LIST } from '../data/mockData';
import { formatSlaBadge } from './TableView';

interface KanbanViewProps {
  filters: NavigationFilters;
  onSetVista: (vista: VistaType, ticketId?: string) => void;
  onSetFiltroRapido: (filtro: 'urgentes' | 'sla_riesgo' | 'esperando' | '') => void;
  onSetFilterParam: (key: keyof NavigationFilters, value: string) => void;
  onClearAllFilters: () => void;
  getVistaHref: (vista: VistaType) => string;
}

// 6 Columnas estrictamente en este orden (Requirement 8 y 12)
const KANBAN_COLUMNS: {
  status: TicketStatus;
  label: string;
  topColor: string;
  dotColor: string;
}[] = [
  { status: 'Nuevo', label: 'Nuevo', topColor: '#8A9AB5', dotColor: 'bg-[#8A9AB5]' },
  { status: 'Asignado', label: 'Asignado', topColor: '#1565C0', dotColor: 'bg-[#1565C0]' },
  { status: 'En progreso', label: 'En progreso', topColor: '#3FA2E8', dotColor: 'bg-[#3FA2E8]' },
  { status: 'En espera del cliente', label: 'En espera del cliente', topColor: '#F59E0B', dotColor: 'bg-[#F59E0B]' },
  { status: 'Resuelto', label: 'Resuelto', topColor: '#16A34A', dotColor: 'bg-[#16A34A]' },
  { status: 'Cerrado', label: 'Cerrado', topColor: '#5B6B82', dotColor: 'bg-[#5B6B82]' }
];

// Colores de borde izquierdo por prioridad (Requirement 13)
const getPriorityBorderColor = (priority: Priority): string => {
  switch (priority) {
    case 'Crítica':
      return 'border-l-[#E11D48]';
    case 'Alta':
      return 'border-l-[#F37021]';
    case 'Media':
      return 'border-l-[#94A3B8]';
    case 'Baja':
      return 'border-l-[#CBD5E1]';
    default:
      return 'border-l-[#CBD5E1]';
  }
};

// Componente Tarjeta Kanban
interface KanbanCardProps {
  ticket: Ticket;
  onSelectTicket?: (ticket: Ticket) => void;
  onTakeTicket?: (ticketId: string) => void;
  isDragging?: boolean;
  isOverlay?: boolean;
}

const KanbanCard: React.FC<KanbanCardProps> = ({
  ticket,
  onSelectTicket,
  onTakeTicket,
  isDragging = false,
  isOverlay = false
}) => {
  const isResolvedOrClosed = ticket.status === 'Resuelto' || ticket.status === 'Cerrado';
  const slaInfo = formatSlaBadge(ticket);

  // Truncar empresa a 18 caracteres (Requirement 13)
  const displayCompany =
    ticket.company.length > 18 ? `${ticket.company.slice(0, 18)}...` : ticket.company;

  return (
    <div
      onClick={() => onSelectTicket && onSelectTicket(ticket)}
      className={`relative bg-white dark:bg-[#0E2A52] rounded-[8px] p-3 border border-slate-200/80 dark:border-[#1E3F73] shadow-xs border-l-[4px] ${getPriorityBorderColor(
        ticket.priority
      )} select-none transition-shadow ${
        isOverlay
          ? 'cursor-grabbing'
          : isDragging
          ? 'opacity-30'
          : 'hover:shadow-md cursor-grab active:cursor-grabbing'
      }`}
    >
      {/* Fila Superior: Código monoespaciado + Chips de Prioridad (solo Crítica y Alta) */}
      <div className="flex items-center justify-between gap-1.5 mb-1.5">
        <span className="font-mono text-xs font-bold text-slate-800 dark:text-[#E8EEF9] tracking-tight">
          {ticket.code}
        </span>

        {/* Requirement 13: Chips de prioridad solo en Crítica y Alta */}
        {ticket.priority === 'Crítica' && (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-rose-50 dark:bg-rose-950/40 text-[#E11D48] dark:text-rose-400 border border-rose-200 dark:border-rose-800/50">
            Crítica
          </span>
        )}
        {ticket.priority === 'Alta' && (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-orange-50 dark:bg-orange-950/40 text-[#F37021] border border-orange-200 dark:border-orange-800/50">
            Alta
          </span>
        )}
      </div>

      {/* Título del Ticket */}
      <h3 className="text-xs font-semibold text-slate-900 dark:text-[#E8EEF9] line-clamp-2 leading-snug mb-2">
        {ticket.title}
      </h3>

      {/* Empresa (truncada a 18 caracteres) */}
      <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-[#94A9CC] mb-2.5">
        <span className="material-symbols-outlined text-xs text-slate-400 dark:text-[#94A9CC] leading-none">
          business
        </span>
        <span className="truncate" title={ticket.company}>
          {displayCompany}
        </span>
      </div>

      {/* Fila Inferior: SLA + Agente / Botón Tomar */}
      <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-[#1E3F73]">
        {/* SLA Display (Requirement 13) */}
        {isResolvedOrClosed ? (
          <div className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800/50">
            <span className="material-symbols-outlined text-[13px] leading-none text-emerald-600 dark:text-emerald-400">
              check_circle
            </span>
            <span>{ticket.status === 'Resuelto' ? 'Resuelto' : 'Cerrado'}</span>
          </div>
        ) : (
          <div
            className={`inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-0.5 rounded border ${slaInfo.bgClass} ${slaInfo.colorClass} ${slaInfo.borderClass}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${slaInfo.dotClass}`} />
            <span className="font-mono text-[11px]">{slaInfo.text}</span>
          </div>
        )}

        {/* Agente con avatar de 24 px o botón Tomar (Requirement 13) */}
        <div>
          {ticket.assignedAgent && ticket.assignedAgent.name ? (
            <div className="flex items-center gap-1" title={`Asignado a: ${ticket.assignedAgent.name}`}>
              <img
                src={
                  ticket.assignedAgent.avatar ||
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80'
                }
                alt={ticket.assignedAgent.name}
                className="w-6 h-6 rounded-full object-cover border border-slate-200 dark:border-[#1E3F73]"
              />
            </div>
          ) : (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (onTakeTicket) onTakeTicket(ticket.id);
              }}
              className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-700/60 transition-colors cursor-pointer focus:ring-2 focus:ring-blue-600 focus:outline-none"
              title="Autoasignarme este ticket"
            >
              Tomar
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Item draggable individual para el tablero
const DraggableKanbanItem: React.FC<{
  ticket: Ticket;
  onSelectTicket: (ticket: Ticket) => void;
  onTakeTicket: (ticketId: string) => void;
}> = ({ ticket, onSelectTicket, onTakeTicket }) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: ticket.id,
    data: { ticket }
  });

  return (
    <div ref={setNodeRef} {...attributes} {...listeners}>
      <KanbanCard
        ticket={ticket}
        onSelectTicket={onSelectTicket}
        onTakeTicket={onTakeTicket}
        isDragging={isDragging}
      />
    </div>
  );
};

// Columna Droppable
interface DroppableColumnProps {
  status: TicketStatus;
  label: string;
  topColor: string;
  dotColor: string;
  tickets: Ticket[];
  onSelectTicket: (ticket: Ticket) => void;
  onTakeTicket: (ticketId: string) => void;
  isCerradoCollapsed?: boolean;
  onToggleCerradoCollapse?: () => void;
}

const DroppableColumn: React.FC<DroppableColumnProps> = ({
  status,
  label,
  topColor,
  dotColor,
  tickets,
  onSelectTicket,
  onTakeTicket,
  isCerradoCollapsed,
  onToggleCerradoCollapse
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: status
  });

  // Si es la columna Cerrado y está plegada (Requirement 8)
  if (status === 'Cerrado' && isCerradoCollapsed) {
    return (
      <div
        ref={setNodeRef}
        onClick={onToggleCerradoCollapse}
        style={{ borderTopColor: topColor }}
        className={`w-14 min-w-[56px] flex flex-col items-center py-3.5 px-2 rounded-[12px] bg-[#EEF2F8] dark:bg-[#0E2A52]/70 border border-transparent dark:border-[#1E3F73] border-t-[3px] shadow-2xs cursor-pointer transition-all ${
          isOver
            ? 'border-2 border-dashed border-[#1565C0]/40 bg-[#1565C0]/[0.05]'
            : 'hover:bg-[#E5EBF4] dark:hover:bg-[#0E2A52]'
        }`}
        title="Columna Cerrado (haz clic para desplegar o arrastra tarjetas aquí)"
      >
        <div className="flex flex-col items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${dotColor}`} />
          <span className="w-5 h-5 rounded-full bg-slate-200/80 dark:bg-[#081B3A] text-slate-700 dark:text-[#E8EEF9] text-[11px] font-bold flex items-center justify-center">
            {tickets.length}
          </span>
          <span className="material-symbols-outlined text-sm text-slate-500 dark:text-[#94A9CC] mt-1">unfold_more</span>
        </div>

        {/* Texto vertical rotado */}
        <div className="mt-8 flex items-center justify-center -rotate-90 whitespace-nowrap text-xs font-bold text-slate-600 dark:text-[#94A9CC] tracking-wider">
          Cerrado
        </div>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={{ borderTopColor: topColor }}
      className={`w-[82vw] max-w-[288px] min-w-0 sm:w-[288px] sm:min-w-[288px] sm:max-w-[288px] flex flex-col rounded-[12px] bg-[#EEF2F8] dark:bg-[#081B3A] border border-transparent dark:border-[#1E3F73] border-t-[3px] shadow-2xs h-full overflow-hidden transition-all snap-start sm:snap-align-none ${
        isOver ? 'border-2 border-dashed border-[#1565C0]/40 bg-[#1565C0]/[0.05]' : ''
      }`}
    >
      {/* Cabecera fija con punto de color, nombre y contador en texto plano (Requirement 12) */}
      <div className="p-3 bg-[#EEF2F8] dark:bg-[#081B3A] border-b border-slate-200/60 dark:border-[#1E3F73] flex items-center justify-between flex-shrink-0 transition-colors">
        <div className="flex items-center gap-2 min-w-0">
          <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${dotColor}`} />
          <span className="text-xs font-bold text-slate-900 dark:text-[#E8EEF9] tracking-tight truncate">{label}</span>
          <span className="text-xs font-normal text-slate-500 dark:text-[#94A9CC] flex-shrink-0">{tickets.length}</span>
        </div>

        {status === 'Cerrado' && onToggleCerradoCollapse && (
          <button
            onClick={onToggleCerradoCollapse}
            className="p-1 rounded text-slate-400 dark:text-[#94A9CC] hover:text-slate-700 dark:hover:text-[#E8EEF9] hover:bg-slate-200/60 dark:hover:bg-[#0E2A52] transition-colors cursor-pointer"
            title="Plegar columna Cerrado"
          >
            <span className="material-symbols-outlined text-sm leading-none">unfold_less</span>
          </button>
        )}
      </div>

      {/* Lista de tarjetas con scroll vertical */}
      <div className="flex-1 p-2.5 space-y-2.5 overflow-y-auto custom-scrollbar min-h-[140px]">
        {tickets.length === 0 ? (
          <div className="h-28 rounded-lg border border-dashed border-slate-300/80 dark:border-[#1E3F73] flex flex-col items-center justify-center p-3 text-center">
            <span className="text-xs text-slate-400 dark:text-[#94A9CC] font-medium">Sin tickets</span>
          </div>
        ) : (
          tickets.map((t) => (
            <DraggableKanbanItem
              key={t.id}
              ticket={t}
              onSelectTicket={onSelectTicket}
              onTakeTicket={onTakeTicket}
            />
          ))
        )}
      </div>
    </div>
  );
};

// Componente Principal KanbanView
export const KanbanView: React.FC<KanbanViewProps> = ({
  filters,
  onSetVista,
  onSetFiltroRapido,
  onSetFilterParam,
  onClearAllFilters,
  getVistaHref
}) => {
  const { tickets, currentUser, moveTicket, takeTicket, showToast } = useTickets();

  // Estado de columna Cerrado plegada por defecto (Requirement 8)
  const [isCerradoCollapsed, setIsCerradoCollapsed] = useState(true);

  // Tarjeta arrastrada activa para DragOverlay
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null);

  // Popover de Filtros Avanzados (Requirement 15: mismos filtros que la tabla)
  const [filterPopoverOpen, setFilterPopoverOpen] = useState(false);
  const filterPopoverRef = useRef<HTMLDivElement>(null);

  // Diálogo para supervisor al mover a Asignado/En progreso/En espera sin agente (Requirement 11)
  const [pendingSupervisorMove, setPendingSupervisorMove] = useState<{
    ticket: Ticket;
    targetStatus: TicketStatus;
    selectedAgent: string;
  } | null>(null);

  // Cerrar popover al hacer clic fuera
  useEffect(() => {
    const handleCloseMenu = (e: MouseEvent) => {
      if (filterPopoverRef.current && !filterPopoverRef.current.contains(e.target as Node)) {
        setFilterPopoverOpen(false);
      }
    };
    window.addEventListener('click', handleCloseMenu);
    return () => window.removeEventListener('click', handleCloseMenu);
  }, []);

  // Sensores estrictamente según Requirement 9
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
    useSensor(KeyboardSensor)
  );

  // Filtrar tickets por bandeja y parámetros URL (Requirement 3 y 15)
  const filteredTickets = useMemo(() => {
    return filterTicketsByNavigation(tickets, filters, currentUser);
  }, [tickets, filters, currentUser]);

  // Contar activos en la vista actual
  const activeCountInView = useMemo(() => {
    return filteredTickets.filter((t) => t.status !== 'Resuelto' && t.status !== 'Cerrado').length;
  }, [filteredTickets]);

  // Conteo de filtros activos para badge
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.empresa) count++;
    if (filters.agente) count++;
    if (filters.prioridad) count++;
    if (filters.categoria) count++;
    if (filters.sla) count++;
    return count;
  }, [filters]);

  // Agrupar y ordenar tickets por columna según vencimiento de SLA (Requirement 10)
  const columnsData = useMemo(() => {
    const grouped: Record<TicketStatus, Ticket[]> = {
      Nuevo: [],
      Asignado: [],
      'En progreso': [],
      'En espera del cliente': [],
      Resuelto: [],
      Cerrado: []
    };

    filteredTickets.forEach((t) => {
      if (grouped[t.status]) {
        grouped[t.status].push(t);
      }
    });

    // Orden automático por vencimiento de SLA (más urgente arriba)
    Object.keys(grouped).forEach((statusKey) => {
      const s = statusKey as TicketStatus;
      grouped[s].sort((a, b) => {
        if (s === 'Resuelto' || s === 'Cerrado') {
          return b.id.localeCompare(a.id);
        }
        if (a.isBreached && !b.isBreached) return -1;
        if (!a.isBreached && b.isBreached) return 1;
        return a.slaMinutesRemaining - b.slaMinutesRemaining;
      });
    });

    return grouped;
  }, [filteredTickets]);

  // Drag handlers
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const ticket = active.data.current?.ticket as Ticket;
    if (ticket) {
      setActiveTicket(ticket);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTicket(null);

    if (!over) return;

    const targetStatus = over.id as TicketStatus;
    const draggedTicket = tickets.find((t) => t.id === active.id);
    if (!draggedTicket || draggedTicket.status === targetStatus) return;

    if (!currentUser) return;

    // Regla 11: Un agente solo mueve tickets propios o sin asignar; si no puede, la tarjeta vuelve y aparece toast de error
    const isOwner =
      draggedTicket.assignedAgent &&
      draggedTicket.assignedAgent.name
        .toLowerCase()
        .includes(currentUser.name.split(' ')[0].toLowerCase());
    const isUnassigned = !draggedTicket.assignedAgent || !draggedTicket.assignedAgent.name;
    const canMove =
      currentUser.role === 'admin' ||
      currentUser.role === 'supervisor' ||
      isOwner ||
      isUnassigned;

    if (!canMove) {
      showToast('Solo puedes gestionar tus propios tickets o tickets sin asignar', {
        type: 'error'
      });
      return;
    }

    // Regla 11: En Asignado, En progreso o En espera del cliente, si el ticket no tiene agente:
    // El agente se autoasigna; el supervisor ve un diálogo pequeño con selector de agente (por defecto él mismo)
    const isMoveToActiveWithoutAgent =
      (targetStatus === 'Asignado' ||
        targetStatus === 'En progreso' ||
        targetStatus === 'En espera del cliente') &&
      !draggedTicket.assignedAgent;

    if (isMoveToActiveWithoutAgent) {
      if (currentUser.role === 'supervisor' || currentUser.role === 'admin') {
        setPendingSupervisorMove({
          ticket: draggedTicket,
          targetStatus,
          selectedAgent: currentUser.name
        });
        return;
      }
    }

    // Para cualquier otro movimiento o si ya tiene agente
    moveTicket(draggedTicket.id, targetStatus);
  };

  // Confirmar movimiento del supervisor tras seleccionar agente
  const handleConfirmSupervisorMove = () => {
    if (!pendingSupervisorMove) return;
    moveTicket(pendingSupervisorMove.ticket.id, pendingSupervisorMove.targetStatus, {
      assignedAgentName: pendingSupervisorMove.selectedAgent
    });
    setPendingSupervisorMove(null);
  };

  const handleCancelSupervisorMove = () => {
    setPendingSupervisorMove(null);
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative select-none bg-[#F5F7FB] dark:bg-[#081B3A] transition-colors duration-200">
      {/* Subheader Fijo: Título según ?bandeja + Contador de activos + Filtros Rápidos + Switcher de Vistas */}
      <section className="px-3 sm:px-6 pt-3 pb-2 sm:pt-3.5 flex-shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-[#E8EEF9] tracking-tight flex items-center gap-2 min-w-0">
              {getBandejaTitle(filters.bandeja)}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-700/60">
              {activeCountInView} activos
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Requirement 4: Filtros rápidos EXCLUSIVAMENTE Urgentes, SLA en riesgo, Esperando cliente */}
            <div className="flex items-center bg-slate-200/80 dark:bg-[#0E2A52] p-0.5 rounded-xl border border-slate-300/60 dark:border-[#1E3F73] text-xs font-semibold overflow-x-auto custom-scrollbar transition-colors">
              <button
                onClick={() => {
                  onSetFiltroRapido(filters.filtroRapido === 'urgentes' ? '' : 'urgentes');
                }}
                className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer focus:ring-2 focus:ring-blue-600 focus:outline-none ${
                  filters.filtroRapido === 'urgentes'
                    ? 'bg-white dark:bg-[#081B3A] text-rose-700 dark:text-rose-400 shadow-xs'
                    : 'text-slate-600 dark:text-[#94A9CC] hover:text-rose-600 dark:hover:text-rose-400'
                }`}
              >
                <span className="material-symbols-outlined text-xs leading-none text-rose-500">
                  warning
                </span>
                <span>Urgentes</span>
              </button>

              <button
                onClick={() => {
                  onSetFiltroRapido(filters.filtroRapido === 'sla_riesgo' ? '' : 'sla_riesgo');
                }}
                className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer focus:ring-2 focus:ring-blue-600 focus:outline-none ${
                  filters.filtroRapido === 'sla_riesgo'
                    ? 'bg-white dark:bg-[#081B3A] text-rose-700 dark:text-rose-400 shadow-xs'
                    : 'text-slate-600 dark:text-[#94A9CC] hover:text-slate-900 dark:hover:text-[#E8EEF9]'
                }`}
              >
                <span className="material-symbols-outlined text-xs leading-none text-amber-500">
                  alarm
                </span>
                <span>SLA en riesgo</span>
              </button>

              <button
                onClick={() => {
                  onSetFiltroRapido(filters.filtroRapido === 'esperando' ? '' : 'esperando');
                }}
                className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer focus:ring-2 focus:ring-blue-600 focus:outline-none ${
                  filters.filtroRapido === 'esperando'
                    ? 'bg-white dark:bg-[#081B3A] text-sky-700 dark:text-sky-400 shadow-xs'
                    : 'text-slate-600 dark:text-[#94A9CC] hover:text-slate-900 dark:hover:text-[#E8EEF9]'
                }`}
              >
                <span className="material-symbols-outlined text-xs leading-none text-sky-500">
                  hourglass_empty
                </span>
                <span>Esperando cliente</span>
              </button>
            </div>

            {/* Selector de Vistas con Links semánticos que conservan bandeja y filtros (Requirement 2 & 3) */}
            <div className="flex items-center bg-slate-100 dark:bg-[#0E2A52] p-0.5 rounded-xl border border-slate-200/80 dark:border-[#1E3F73] text-xs transition-colors">
              <a
                href={getVistaHref('tabla')}
                onClick={(e) => {
                  e.preventDefault();
                  onSetVista('tabla');
                }}
                className={`px-2.5 py-1 rounded-lg font-medium flex items-center gap-1 transition-colors cursor-pointer focus:ring-2 focus:ring-blue-600 focus:outline-none no-underline ${
                  filters.vista === 'tabla'
                    ? 'bg-white dark:bg-[#081B3A] text-blue-700 dark:text-blue-400 shadow-xs font-semibold'
                    : 'text-slate-600 dark:text-[#94A9CC] hover:text-slate-900 dark:hover:text-[#E8EEF9]'
                }`}
                title="Vista tabla"
              >
                <span className="material-symbols-outlined text-sm">table_rows</span>
                <span className="hidden md:inline">Tabla</span>
              </a>
              <a
                href={getVistaHref('detalle')}
                onClick={(e) => {
                  e.preventDefault();
                  onSetVista('detalle');
                }}
                className={`px-2.5 py-1 rounded-lg font-medium flex items-center gap-1 transition-colors cursor-pointer focus:ring-2 focus:ring-blue-600 focus:outline-none no-underline ${
                  filters.vista === 'detalle'
                    ? 'bg-white dark:bg-[#081B3A] text-blue-700 dark:text-blue-400 shadow-xs font-semibold'
                    : 'text-slate-600 dark:text-[#94A9CC] hover:text-slate-900 dark:hover:text-[#E8EEF9]'
                }`}
                title="Vista master-detalle"
              >
                <span className="material-symbols-outlined text-sm">view_sidebar</span>
                <span className="hidden md:inline">Detalle</span>
              </a>
              <a
                href={getVistaHref('kanban')}
                onClick={(e) => {
                  e.preventDefault();
                  onSetVista('kanban');
                }}
                className={`px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1 focus:ring-2 focus:ring-blue-600 focus:outline-none no-underline ${
                  filters.vista === 'kanban'
                    ? 'bg-white dark:bg-[#081B3A] text-blue-700 dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-[#94A9CC] hover:text-slate-900 dark:hover:text-[#E8EEF9]'
                }`}
                title="Tablero kanban"
              >
                <span className="material-symbols-outlined text-sm">view_kanban</span>
                <span className="hidden md:inline">Kanban</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Barra de Filtros (Requirement 15: mismos filtros de la tabla) */}
      <section className="px-3 sm:px-6 py-1.5 flex-shrink-0 space-y-1.5">
        <div className="bg-white dark:bg-[#0E2A52] px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#1E3F73] shadow-2xs flex flex-wrap items-center justify-between gap-3 transition-colors">
          {/* Buscador local */}
          <div className="relative flex-1 min-w-0 sm:min-w-[220px] basis-full sm:basis-auto">
            <span className="material-symbols-outlined absolute left-2.5 top-2 text-slate-400 dark:text-[#94A9CC] text-sm">
              filter_alt
            </span>
            <input
              value={filters.busqueda || ''}
              onChange={(e) => onSetFilterParam('busqueda', e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-[#081B3A] border border-slate-200 dark:border-[#1E3F73] rounded-lg text-slate-800 dark:text-[#E8EEF9] placeholder:text-slate-400 dark:placeholder:text-[#94A9CC]/60 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all font-sans"
              placeholder="Filtrar tarjetas por asunto, código o empresa..."
              type="text"
            />
          </div>

          {/* Botón Filtros */}
          <div className="relative" ref={filterPopoverRef}>
            <button
              onClick={() => setFilterPopoverOpen(!filterPopoverOpen)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border focus:ring-2 focus:ring-blue-600 focus:outline-none ${
                activeFiltersCount > 0
                  ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700'
                  : 'bg-slate-50 dark:bg-[#081B3A] hover:bg-slate-100 dark:hover:bg-[#081B3A]/80 text-slate-700 dark:text-[#E8EEF9] border-slate-200 dark:border-[#1E3F73]'
              }`}
            >
              <span className="material-symbols-outlined text-base">tune</span>
              <span>Filtros</span>
              {activeFiltersCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[11px] font-bold flex items-center justify-center ml-0.5">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            {/* Popover con filtros */}
            {filterPopoverOpen && (
              <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-1.5rem)] bg-white dark:bg-[#0E2A52] rounded-2xl shadow-xl border border-slate-200 dark:border-[#1E3F73] p-4 z-40 text-xs animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#1E3F73] pb-2 mb-3">
                  <span className="font-bold text-slate-900 dark:text-[#E8EEF9] text-xs">Filtros avanzados</span>
                  {activeFiltersCount > 0 && (
                    <button
                      onClick={onClearAllFilters}
                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                    >
                      Limpiar todos
                    </button>
                  )}
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 dark:text-[#94A9CC] uppercase tracking-wider mb-1">
                      Empresa cliente
                    </label>
                    <select
                      value={filters.empresa || ''}
                      onChange={(e) => onSetFilterParam('empresa', e.target.value)}
                      className="w-full py-1.5 px-2 bg-slate-50 dark:bg-[#081B3A] border border-slate-200 dark:border-[#1E3F73] rounded-lg text-xs text-slate-800 dark:text-[#E8EEF9] focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    >
                      <option value="">Todas las empresas</option>
                      {COMPANIES_LIST.map((comp) => (
                        <option key={comp} value={comp}>
                          {comp}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 dark:text-[#94A9CC] uppercase tracking-wider mb-1">
                      Agente asignado
                    </label>
                    <select
                      value={filters.agente || ''}
                      onChange={(e) => onSetFilterParam('agente', e.target.value)}
                      className="w-full py-1.5 px-2 bg-slate-50 dark:bg-[#081B3A] border border-slate-200 dark:border-[#1E3F73] rounded-lg text-xs text-slate-800 dark:text-[#E8EEF9] focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    >
                      <option value="">Todos los agentes</option>
                      {AGENTS_LIST.map((agent) => (
                        <option key={agent} value={agent}>
                          {agent}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 dark:text-[#94A9CC] uppercase tracking-wider mb-1">
                      Prioridad
                    </label>
                    <select
                      value={filters.prioridad || ''}
                      onChange={(e) => onSetFilterParam('prioridad', e.target.value)}
                      className="w-full py-1.5 px-2 bg-slate-50 dark:bg-[#081B3A] border border-slate-200 dark:border-[#1E3F73] rounded-lg text-xs text-slate-800 dark:text-[#E8EEF9] focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    >
                      <option value="">Todas las prioridades</option>
                      <option value="Crítica">Crítica</option>
                      <option value="Alta">Alta</option>
                      <option value="Media">Media</option>
                      <option value="Baja">Baja</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 dark:text-[#94A9CC] uppercase tracking-wider mb-1">
                      Categoría
                    </label>
                    <select
                      value={filters.categoria || ''}
                      onChange={(e) => onSetFilterParam('categoria', e.target.value)}
                      className="w-full py-1.5 px-2 bg-slate-50 dark:bg-[#081B3A] border border-slate-200 dark:border-[#1E3F73] rounded-lg text-xs text-slate-800 dark:text-[#E8EEF9] focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    >
                      <option value="">Todas las categorías</option>
                      {CATEGORIES_LIST.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 dark:text-[#94A9CC] uppercase tracking-wider mb-1">
                      Estado de SLA
                    </label>
                    <select
                      value={filters.sla || ''}
                      onChange={(e) => onSetFilterParam('sla', e.target.value)}
                      className="w-full py-1.5 px-2 bg-slate-50 dark:bg-[#081B3A] border border-slate-200 dark:border-[#1E3F73] rounded-lg text-xs text-slate-800 dark:text-[#E8EEF9] focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    >
                      <option value="">Todos los estados de SLA</option>
                      <option value="rango">En rango (&gt; 50 % restante)</option>
                      <option value="alerta">Alerta (20 % a 50 %)</option>
                      <option value="riesgo">En riesgo (&lt; 20 % restante)</option>
                      <option value="vencido">SLA vencido</option>
                    </select>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-[#1E3F73] flex justify-end mt-3">
                  <button
                    onClick={() => setFilterPopoverOpen(false)}
                    className="px-3 py-1 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-semibold cursor-pointer"
                  >
                    Listo
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Chips de Filtros Activos con botón Limpiar */}
        {(activeFiltersCount > 0 || filters.filtroRapido || filters.busqueda) && (
          <div className="flex items-center gap-1.5 flex-wrap px-1">
            <span className="text-[11px] font-semibold text-slate-400 dark:text-[#94A9CC] mr-1">Filtros aplicados:</span>

            {filters.filtroRapido && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100/80 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-700/60">
                <span>
                  {filters.filtroRapido === 'urgentes'
                    ? 'Urgentes'
                    : filters.filtroRapido === 'sla_riesgo'
                    ? 'SLA en riesgo'
                    : 'Esperando cliente'}
                </span>
                <button
                  onClick={() => onSetFiltroRapido('')}
                  className="hover:text-blue-950 dark:hover:text-blue-200 cursor-pointer"
                >
                  ×
                </button>
              </span>
            )}

            {filters.empresa && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-200 dark:bg-[#1E3F73] text-slate-800 dark:text-[#E8EEF9]">
                <span>Empresa: {filters.empresa}</span>
                <button
                  onClick={() => onSetFilterParam('empresa', '')}
                  className="hover:text-slate-950 dark:hover:text-white cursor-pointer"
                >
                  ×
                </button>
              </span>
            )}

            {filters.agente && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-200 dark:bg-[#1E3F73] text-slate-800 dark:text-[#E8EEF9]">
                <span>Agente: {filters.agente}</span>
                <button
                  onClick={() => onSetFilterParam('agente', '')}
                  className="hover:text-slate-950 dark:hover:text-white cursor-pointer"
                >
                  ×
                </button>
              </span>
            )}

            {filters.prioridad && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-200 dark:bg-[#1E3F73] text-slate-800 dark:text-[#E8EEF9]">
                <span>Prioridad: {filters.prioridad}</span>
                <button
                  onClick={() => onSetFilterParam('prioridad', '')}
                  className="hover:text-slate-950 dark:hover:text-white cursor-pointer"
                >
                  ×
                </button>
              </span>
            )}

            {filters.categoria && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-200 dark:bg-[#1E3F73] text-slate-800 dark:text-[#E8EEF9]">
                <span>Categoría: {filters.categoria}</span>
                <button
                  onClick={() => onSetFilterParam('categoria', '')}
                  className="hover:text-slate-950 dark:hover:text-white cursor-pointer"
                >
                  ×
                </button>
              </span>
            )}

            {filters.sla && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-200 dark:bg-[#1E3F73] text-slate-800 dark:text-[#E8EEF9]">
                <span>SLA: {filters.sla}</span>
                <button
                  onClick={() => onSetFilterParam('sla', '')}
                  className="hover:text-slate-950 dark:hover:text-white cursor-pointer"
                >
                  ×
                </button>
              </span>
            )}

            {filters.busqueda && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-200 dark:bg-[#1E3F73] text-slate-800 dark:text-[#E8EEF9]">
                <span>Búsqueda: "{filters.busqueda}"</span>
                <button
                  onClick={() => onSetFilterParam('busqueda', '')}
                  className="hover:text-slate-950 dark:hover:text-white cursor-pointer"
                >
                  ×
                </button>
              </span>
            )}

            <button
              onClick={onClearAllFilters}
              className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline font-semibold ml-1 cursor-pointer"
            >
              Limpiar
            </button>
          </div>
        )}

        {/* Línea discreta instructiva (Requirement 7) */}
        <p className="text-xs text-slate-500 dark:text-[#94A9CC] font-normal px-1">
          <span className="hidden sm:inline">Arrastra una tarjeta para cambiar su estado</span>
          <span className="sm:hidden">Mantén pulsada una tarjeta para moverla de columna</span>
        </p>
      </section>

      {/* Tablero Kanban con Arrastre y Soltado (Requirements 8, 9, 10, 12, 13, 14) */}
      <section className="flex-1 px-3 sm:px-6 pt-2 pb-4 sm:pb-6 min-h-0 overflow-x-auto overflow-y-hidden custom-scrollbar">
        <DndContext
          sensors={sensors}
          collisionDetection={pointerWithin}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex flex-row items-stretch gap-3 sm:gap-4 h-full min-w-max pb-1 snap-x snap-mandatory sm:snap-none">
            {KANBAN_COLUMNS.map((col) => (
              <DroppableColumn
                key={col.status}
                status={col.status}
                label={col.label}
                topColor={col.topColor}
                dotColor={col.dotColor}
                tickets={columnsData[col.status] || []}
                onSelectTicket={(t) => onSetVista('detalle', t.id)}
                onTakeTicket={takeTicket}
                isCerradoCollapsed={col.status === 'Cerrado' ? isCerradoCollapsed : undefined}
                onToggleCerradoCollapse={
                  col.status === 'Cerrado'
                    ? () => setIsCerradoCollapsed(!isCerradoCollapsed)
                    : undefined
                }
              />
            ))}
          </div>

          {/* DragOverlay (Requirement 14) */}
          <DragOverlay>
            {activeTicket ? (
              <div className="rotate-[1.5deg] scale-[1.02] shadow-2xl rounded-[8px] bg-white dark:bg-[#0E2A52] border border-slate-200/90 dark:border-[#1E3F73] pointer-events-none w-[80vw] max-w-[272px]">
                <KanbanCard ticket={activeTicket} isOverlay />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </section>

      {/* Diálogo Pequeño con Selector de Agente para Supervisor (Requirement 11) */}
      {pendingSupervisorMove && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/40 dark:bg-slate-950/70 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in">
          <div className="bg-white dark:bg-[#0E2A52] rounded-t-2xl sm:rounded-2xl shadow-2xl border border-slate-200 dark:border-[#1E3F73] max-w-sm w-full p-5 space-y-4 max-h-[90dvh] overflow-y-auto custom-scrollbar pb-safe sm:pb-5 transition-colors">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-lg">person_add</span>
              </span>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-[#E8EEF9]">
                  Asignar agente al ticket
                </h3>
                <p className="text-xs text-slate-500 dark:text-[#94A9CC]">
                  {pendingSupervisorMove.ticket.code} a estado "{pendingSupervisorMove.targetStatus}"
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-[#94A9CC]">
              Este ticket no cuenta con agente asignado. Como supervisor, puedes designar el
              responsable o asignártelo a ti mismo:
            </p>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 dark:text-[#94A9CC] uppercase tracking-wider mb-1">
                Agente responsable
              </label>
              <select
                value={pendingSupervisorMove.selectedAgent}
                onChange={(e) =>
                  setPendingSupervisorMove({
                    ...pendingSupervisorMove,
                    selectedAgent: e.target.value
                  })
                }
                className="w-full py-2 px-3 bg-slate-50 dark:bg-[#081B3A] border border-slate-200 dark:border-[#1E3F73] rounded-xl text-xs text-slate-800 dark:text-[#E8EEF9] font-medium focus:ring-2 focus:ring-blue-600 focus:outline-none"
              >
                {currentUser && (
                  <option value={currentUser.name}>{currentUser.name} (Tú mismo)</option>
                )}
                {AGENTS_LIST.filter((a) => a !== currentUser?.name).map((ag) => (
                  <option key={ag} value={ag}>
                    {ag}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-[#1E3F73]">
              <button
                type="button"
                onClick={handleCancelSupervisorMove}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-[#1E3F73] hover:bg-slate-50 dark:hover:bg-[#081B3A] text-slate-700 dark:text-[#E8EEF9] text-xs font-semibold cursor-pointer transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmSupervisorMove}
                className="px-3.5 py-1.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold cursor-pointer transition-colors shadow-xs"
              >
                Asignar y mover
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
