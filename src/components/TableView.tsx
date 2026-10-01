import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Ticket, TicketStatus, KPIStats, NavigationFilters, VistaType } from '../types';
import { useTickets } from '../context/TicketsContext';
import { filterTicketsByNavigation, getBandejaTitle } from '../utils/filterTickets';
import { COMPANIES_LIST, AGENTS_LIST, CATEGORIES_LIST } from '../data/mockData';

interface TableViewProps {
  kpis: KPIStats;
  filters: NavigationFilters;
  onSetVista: (vista: VistaType, ticketId?: string) => void;
  onSetFiltroRapido: (filtro: 'urgentes' | 'sla_riesgo' | 'esperando' | '') => void;
  onSetFilterParam: (key: keyof NavigationFilters, value: string) => void;
  onClearAllFilters: () => void;
  getVistaHref: (vista: VistaType) => string;
}

export const formatSlaBadge = (ticket: Ticket) => {
  if (ticket.status === 'Resuelto' || ticket.status === 'Cerrado') {
    return {
      text: 'SLA cumplido',
      colorClass: 'text-emerald-700',
      bgClass: 'bg-emerald-50',
      borderClass: 'border-emerald-200',
      dotClass: 'bg-emerald-500'
    };
  }
  if (ticket.isBreached || ticket.slaMinutesRemaining <= 0) {
    return {
      text: 'SLA vencido',
      colorClass: 'text-rose-700',
      bgClass: 'bg-rose-50',
      borderClass: 'border-rose-200',
      dotClass: 'bg-rose-500'
    };
  }

  const hours = Math.floor(ticket.slaMinutesRemaining / 60);
  const mins = ticket.slaMinutesRemaining % 60;
  const timeText = hours > 0 ? `${hours} h ${mins} min` : `${mins} min`;
  const pct = ticket.slaRemainingPercent;

  if (pct > 50) {
    return {
      text: timeText,
      colorClass: 'text-emerald-700',
      bgClass: 'bg-emerald-50',
      borderClass: 'border-emerald-200',
      dotClass: 'bg-emerald-500'
    };
  } else if (pct >= 20) {
    return {
      text: timeText,
      colorClass: 'text-amber-700',
      bgClass: 'bg-amber-50',
      borderClass: 'border-amber-200',
      dotClass: 'bg-amber-500'
    };
  } else {
    return {
      text: timeText,
      colorClass: 'text-rose-700',
      bgClass: 'bg-rose-50',
      borderClass: 'border-rose-200',
      dotClass: 'bg-rose-500'
    };
  }
};

export const getStatusBadgeStyle = (status: TicketStatus) => {
  switch (status) {
    case 'Nuevo':
      return 'bg-amber-50 text-amber-800 border-amber-200';
    case 'Asignado':
      return 'bg-slate-100 text-slate-800 border-slate-200';
    case 'En progreso':
      return 'bg-blue-50 text-blue-800 border-blue-200';
    case 'En espera del cliente':
      return 'bg-sky-50 text-sky-700 border-sky-200';
    case 'Resuelto':
      return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    case 'Cerrado':
      return 'bg-slate-100 text-slate-600 border-slate-200';
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200';
  }
};

export const TableView: React.FC<TableViewProps> = ({
  kpis,
  filters,
  onSetVista,
  onSetFiltroRapido,
  onSetFilterParam,
  onClearAllFilters,
  getVistaHref,
}) => {
  const {
    tickets,
    currentUser,
    takeTicket,
    moveTicket,
    bulkResolve,
    bulkAssign,
    bulkChangeStatus
  } = useTickets();

  // Filter Popover state
  const [filterPopoverOpen, setFilterPopoverOpen] = useState(false);
  const filterPopoverRef = useRef<HTMLDivElement>(null);

  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);

  // Confirmation dialog state for bulk operations
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    action: 'assign' | 'status' | 'resolve';
    statusTarget?: TicketStatus;
    title: string;
    message: string;
  } | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);

  // Row context menu state for options button
  const [rowMenuTicket, setRowMenuTicket] = useState<{ ticket: Ticket; x: number; y: number } | null>(null);
  const rowMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleCloseMenu = (e: MouseEvent) => {
      if (rowMenuRef.current && !rowMenuRef.current.contains(e.target as Node)) {
        setRowMenuTicket(null);
      }
      if (filterPopoverRef.current && !filterPopoverRef.current.contains(e.target as Node)) {
        setFilterPopoverOpen(false);
      }
    };
    window.addEventListener('click', handleCloseMenu);
    return () => window.removeEventListener('click', handleCloseMenu);
  }, []);

  // Filtered tickets using the unified filter utility
  const filteredTickets = useMemo(() => {
    return filterTicketsByNavigation(tickets, filters, currentUser);
  }, [tickets, filters, currentUser]);

  // Paginated tickets
  const totalTickets = filteredTickets.length;
  const totalPages = Math.max(1, Math.ceil(totalTickets / pageSize));
  const paginatedTickets = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredTickets.slice(start, start + pageSize);
  }, [filteredTickets, currentPage, pageSize]);

  // Active filter count (Empresa, Agente, Prioridad, Categoría, SLA)
  const activeFiltersCount = [
    filters.empresa,
    filters.agente,
    filters.prioridad,
    filters.categoria,
    filters.sla
  ].filter(Boolean).length;

  // Active count for subheader: count active (non-resolved, non-closed)
  const activeCountInView = useMemo(() => {
    return filteredTickets.filter(t => t.status !== 'Resuelto' && t.status !== 'Cerrado').length;
  }, [filteredTickets]);

  // Checkbox handlers
  const allCurrentSelected = paginatedTickets.length > 0 && paginatedTickets.every(t => selectedIds.includes(t.id));
  const someCurrentSelected = paginatedTickets.some(t => selectedIds.includes(t.id));

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const newIds = Array.from(new Set([...selectedIds, ...paginatedTickets.map(t => t.id)]));
      setSelectedIds(newIds);
    } else {
      setSelectedIds(selectedIds.filter(id => !paginatedTickets.some(t => t.id === id)));
    }
  };

  const handleToggleRow = (ticketId: string) => {
    if (selectedIds.includes(ticketId)) {
      setSelectedIds(selectedIds.filter(id => id !== ticketId));
    } else {
      setSelectedIds([...selectedIds, ticketId]);
    }
  };

  // Bulk actions triggers with confirmation
  const triggerBulkAssign = () => {
    setConfirmDialog({
      isOpen: true,
      action: 'assign',
      title: 'Asignar tickets seleccionados',
      message: `¿Deseas asignar los ${selectedIds.length} tickets seleccionados a tu usuario (${currentUser?.name || ''})?`
    });
  };

  const triggerBulkChangeStatus = (newStatus: TicketStatus) => {
    setStatusMenuOpen(false);
    setConfirmDialog({
      isOpen: true,
      action: 'status',
      statusTarget: newStatus,
      title: `Cambiar estado a "${newStatus}"`,
      message: `¿Deseas actualizar el estado de ${selectedIds.length} tickets seleccionados a "${newStatus}"?`
    });
  };

  const triggerBulkResolve = () => {
    setConfirmDialog({
      isOpen: true,
      action: 'resolve',
      title: 'Resolver tickets seleccionados',
      message: `¿Deseas marcar como resueltos los ${selectedIds.length} tickets seleccionados? Esta acción registrará el cumplimiento del SLA.`
    });
  };

  const handleExecuteConfirmedAction = () => {
    if (!confirmDialog) return;
    if (confirmDialog.action === 'assign') {
      bulkAssign(selectedIds);
    } else if (confirmDialog.action === 'status' && confirmDialog.statusTarget) {
      bulkChangeStatus(selectedIds, confirmDialog.statusTarget);
    } else if (confirmDialog.action === 'resolve') {
      bulkResolve(selectedIds);
    }
    setConfirmDialog(null);
    setSelectedIds([]);
  };

  // Export CSV
  const handleExport = () => {
    const headers = ['ID', 'Título', 'Empresa', 'Solicitante', 'Categoría', 'Prioridad', 'Estado', 'Asignado', 'SLA restante'];
    const rows = filteredTickets.map(t => [
      t.code,
      `"${t.title.replace(/"/g, '""')}"`,
      `"${t.company}"`,
      `"${t.requesterName}"`,
      `"${t.category}"`,
      t.priority,
      t.status,
      t.assignedAgent ? `"${t.assignedAgent.name}"` : 'Sin asignar',
      formatSlaBadge(t).text
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `SFS_Tickets_${filters.bandeja}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative select-none">
      {/* Subheader Fijo: Título según ?bandeja + Contador de activos + Filtros Rápidos + Switcher de Vistas */}
      <section className="px-3 sm:px-6 pt-3 pb-2 sm:pt-3.5 flex-shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2 min-w-0">
              {getBandejaTitle(filters.bandeja)}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/80">
              {activeCountInView} activos
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap -mx-0.5">
            {/* Requirement 4: Filtros rápidos EXCLUSIVAMENTE Urgentes, SLA en riesgo, Esperando cliente */}
            <div className="flex items-center bg-slate-200/80 p-0.5 rounded-xl border border-slate-300/60 text-xs font-semibold overflow-x-auto custom-scrollbar">
              <button
                onClick={() => {
                  onSetFiltroRapido(filters.filtroRapido === 'urgentes' ? '' : 'urgentes');
                  setCurrentPage(1);
                }}
                className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer focus:ring-2 focus:ring-blue-600 focus:outline-none ${
                  filters.filtroRapido === 'urgentes'
                    ? 'bg-white text-rose-700 shadow-xs'
                    : 'text-slate-600 hover:text-rose-600'
                }`}
              >
                <span className="material-symbols-outlined text-xs leading-none text-rose-500">warning</span>
                <span>Urgentes</span>
              </button>

              <button
                onClick={() => {
                  onSetFiltroRapido(filters.filtroRapido === 'sla_riesgo' ? '' : 'sla_riesgo');
                  setCurrentPage(1);
                }}
                className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer focus:ring-2 focus:ring-blue-600 focus:outline-none ${
                  filters.filtroRapido === 'sla_riesgo'
                    ? 'bg-white text-rose-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span className="material-symbols-outlined text-xs leading-none text-amber-500">alarm</span>
                <span>SLA en riesgo</span>
              </button>

              <button
                onClick={() => {
                  onSetFiltroRapido(filters.filtroRapido === 'esperando' ? '' : 'esperando');
                  setCurrentPage(1);
                }}
                className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer focus:ring-2 focus:ring-blue-600 focus:outline-none ${
                  filters.filtroRapido === 'esperando'
                    ? 'bg-white text-sky-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span className="material-symbols-outlined text-xs leading-none text-sky-500">hourglass_empty</span>
                <span>Esperando cliente</span>
              </button>
            </div>

            {/* Selector de Vistas con Links semánticos que conservan bandeja y filtros (Requirement 2 & 3) */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200/80 text-xs">
              <a
                href={getVistaHref('tabla')}
                onClick={(e) => {
                  e.preventDefault();
                  onSetVista('tabla');
                }}
                className={`px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1 focus:ring-2 focus:ring-blue-600 focus:outline-none no-underline ${
                  filters.vista === 'tabla'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
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
                    ? 'bg-white text-blue-700 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
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
                className={`px-2.5 py-1 rounded-lg font-medium flex items-center gap-1 transition-colors cursor-pointer focus:ring-2 focus:ring-blue-600 focus:outline-none no-underline ${
                  filters.vista === 'kanban'
                    ? 'bg-white text-blue-700 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Tablero kanban"
              >
                <span className="material-symbols-outlined text-sm">view_kanban</span>
                <span className="hidden md:inline">Kanban</span>
              </a>
            </div>

            {/* Botón Exportar */}
            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-all cursor-pointer active:scale-95 focus:ring-2 focus:ring-blue-600 focus:outline-none"
              title="Exportar a CSV"
            >
              <span className="material-symbols-outlined text-base leading-none">download</span>
              <span>Exportar</span>
            </button>
          </div>
        </div>
      </section>

      {/* 4 KPIs Compactos */}
      <section className="px-3 sm:px-6 py-1.5 flex-shrink-0">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
          <div className="bg-white px-2.5 sm:px-3.5 py-2.5 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between gap-1.5">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block leading-tight">
                Abiertos hoy
              </span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-base font-bold text-slate-900">{kpis.openToday}</span>
                <span className="text-xs font-semibold text-emerald-600">{kpis.openTodayDelta}</span>
              </div>
            </div>
            <div className="hidden sm:flex w-8 h-8 rounded-lg bg-blue-50 text-blue-700 items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-lg leading-none">inbox</span>
            </div>
          </div>

          <div className="bg-white px-2.5 sm:px-3.5 py-2.5 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between gap-1.5">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block leading-tight">
                Tiempo 1ª respuesta
              </span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-base font-bold text-slate-900">{kpis.firstResponseTime}</span>
                <span className="text-xs font-medium text-slate-500">{kpis.firstResponseTarget}</span>
              </div>
            </div>
            <div className="hidden sm:flex w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-lg leading-none">speed</span>
            </div>
          </div>

          <div className="bg-white px-2.5 sm:px-3.5 py-2.5 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between gap-1.5">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block leading-tight">
                Cumplimiento SLA
              </span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-base font-bold text-blue-700">{kpis.slaCompliancePercent}%</span>
                <span className="text-xs font-semibold text-emerald-600">En rango</span>
              </div>
            </div>
            <div className="hidden sm:flex w-8 h-8 rounded-lg bg-blue-50 text-blue-700 items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-lg leading-none">verified</span>
            </div>
          </div>

          <div className="bg-white px-2.5 sm:px-3.5 py-2.5 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between gap-1.5">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-rose-600 block leading-tight">
                Críticos en riesgo
              </span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-base font-bold text-rose-600">{kpis.criticalAtRisk} tickets</span>
                <span className="text-xs font-bold text-rose-500">{kpis.criticalAtRiskDetail}</span>
              </div>
            </div>
            <div className="hidden sm:flex w-8 h-8 rounded-lg bg-rose-50 text-rose-600 items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-lg leading-none animate-pulse">alarm</span>
            </div>
          </div>
        </div>
      </section>

      {/* Barra de Filtros con Persistencia en URL */}
      <section className="px-3 sm:px-6 py-2 flex-shrink-0">
        <div className="bg-white px-3.5 py-2.5 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
          {/* Buscador local */}
          <div className="relative flex-1 min-w-0 sm:min-w-[220px] basis-full sm:basis-auto">
            <span className="material-symbols-outlined absolute left-2.5 top-2 text-slate-400 text-sm">
              filter_alt
            </span>
            <input
              value={filters.busqueda || ''}
              onChange={(e) => {
                onSetFilterParam('busqueda', e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all font-sans"
              placeholder="Filtrar por asunto, código o contacto..."
              type="text"
            />
          </div>

          {/* Botón Filtros (Empresa, Agente, Prioridad, Categoría, SLA) */}
          <div className="relative" ref={filterPopoverRef}>
            <button
              onClick={() => setFilterPopoverOpen(!filterPopoverOpen)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border focus:ring-2 focus:ring-blue-600 focus:outline-none ${
                activeFiltersCount > 0
                  ? 'bg-blue-50 text-blue-700 border-blue-300'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
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
              <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-1.5rem)] bg-white rounded-2xl shadow-xl border border-slate-200 p-4 z-40 text-xs animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
                  <span className="font-bold text-slate-900 text-xs">Filtros avanzados</span>
                  {activeFiltersCount > 0 && (
                    <button
                      onClick={onClearAllFilters}
                      className="text-xs text-blue-600 hover:underline cursor-pointer"
                    >
                      Limpiar todos
                    </button>
                  )}
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                      Empresa cliente
                    </label>
                    <select
                      value={filters.empresa || ''}
                      onChange={(e) => {
                        onSetFilterParam('empresa', e.target.value);
                        setCurrentPage(1);
                      }}
                      className="w-full py-1.5 px-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    >
                      <option value="">Todas las empresas</option>
                      {COMPANIES_LIST.map(comp => (
                        <option key={comp} value={comp}>{comp}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                      Agente asignado
                    </label>
                    <select
                      value={filters.agente || ''}
                      onChange={(e) => {
                        onSetFilterParam('agente', e.target.value);
                        setCurrentPage(1);
                      }}
                      className="w-full py-1.5 px-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    >
                      <option value="">Todos los agentes</option>
                      {AGENTS_LIST.map(agent => (
                        <option key={agent} value={agent}>{agent}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                      Prioridad
                    </label>
                    <select
                      value={filters.prioridad || ''}
                      onChange={(e) => {
                        onSetFilterParam('prioridad', e.target.value);
                        setCurrentPage(1);
                      }}
                      className="w-full py-1.5 px-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    >
                      <option value="">Todas las prioridades</option>
                      <option value="Crítica">Crítica</option>
                      <option value="Alta">Alta</option>
                      <option value="Media">Media</option>
                      <option value="Baja">Baja</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                      Categoría
                    </label>
                    <select
                      value={filters.categoria || ''}
                      onChange={(e) => {
                        onSetFilterParam('categoria', e.target.value);
                        setCurrentPage(1);
                      }}
                      className="w-full py-1.5 px-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    >
                      <option value="">Todas las categorías</option>
                      {CATEGORIES_LIST.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                      Estado de SLA
                    </label>
                    <select
                      value={filters.sla || ''}
                      onChange={(e) => {
                        onSetFilterParam('sla', e.target.value);
                        setCurrentPage(1);
                      }}
                      className="w-full py-1.5 px-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    >
                      <option value="">Todos los estados de SLA</option>
                      <option value="rango">En rango (&gt; 50 % restante)</option>
                      <option value="alerta">Alerta (20 % a 50 %)</option>
                      <option value="riesgo">En riesgo (&lt; 20 % restante)</option>
                      <option value="vencido">SLA vencido</option>
                    </select>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex justify-end mt-3">
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

        {/* Chips de Filtros Activos con botón "Limpiar" */}
        {(activeFiltersCount > 0 || filters.filtroRapido || filters.busqueda) && (
          <div className="flex items-center gap-1.5 flex-wrap pt-2 px-1">
            <span className="text-xs text-slate-500 font-medium mr-1">Filtros aplicados:</span>

            {filters.filtroRapido && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                <span>Rápido: {filters.filtroRapido === 'urgentes' ? 'Urgentes' : filters.filtroRapido === 'sla_riesgo' ? 'SLA en riesgo' : 'Esperando cliente'}</span>
                <button
                  onClick={() => onSetFiltroRapido('')}
                  className="hover:text-rose-900 cursor-pointer"
                  title="Eliminar filtro"
                >
                  <span className="material-symbols-outlined text-xs">close</span>
                </button>
              </span>
            )}

            {filters.empresa && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 border border-slate-200">
                <span>Empresa: {filters.empresa}</span>
                <button
                  onClick={() => onSetFilterParam('empresa', '')}
                  className="hover:text-rose-600 cursor-pointer"
                  title="Eliminar filtro"
                >
                  <span className="material-symbols-outlined text-xs">close</span>
                </button>
              </span>
            )}

            {filters.agente && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 border border-slate-200">
                <span>Agente: {filters.agente}</span>
                <button
                  onClick={() => onSetFilterParam('agente', '')}
                  className="hover:text-rose-600 cursor-pointer"
                  title="Eliminar filtro"
                >
                  <span className="material-symbols-outlined text-xs">close</span>
                </button>
              </span>
            )}

            {filters.prioridad && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 border border-slate-200">
                <span>Prioridad: {filters.prioridad}</span>
                <button
                  onClick={() => onSetFilterParam('prioridad', '')}
                  className="hover:text-rose-600 cursor-pointer"
                  title="Eliminar filtro"
                >
                  <span className="material-symbols-outlined text-xs">close</span>
                </button>
              </span>
            )}

            {filters.categoria && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 border border-slate-200">
                <span>Categoría: {filters.categoria}</span>
                <button
                  onClick={() => onSetFilterParam('categoria', '')}
                  className="hover:text-rose-600 cursor-pointer"
                  title="Eliminar filtro"
                >
                  <span className="material-symbols-outlined text-xs">close</span>
                </button>
              </span>
            )}

            {filters.sla && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 border border-slate-200">
                <span>SLA: {filters.sla}</span>
                <button
                  onClick={() => onSetFilterParam('sla', '')}
                  className="hover:text-rose-600 cursor-pointer"
                  title="Eliminar filtro"
                >
                  <span className="material-symbols-outlined text-xs">close</span>
                </button>
              </span>
            )}

            {filters.busqueda && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 border border-slate-200">
                <span>Búsqueda: "{filters.busqueda}"</span>
                <button
                  onClick={() => onSetFilterParam('busqueda', '')}
                  className="hover:text-rose-600 cursor-pointer"
                  title="Eliminar filtro"
                >
                  <span className="material-symbols-outlined text-xs">close</span>
                </button>
              </span>
            )}

            <button
              onClick={onClearAllFilters}
              className="text-xs font-semibold text-blue-700 hover:text-blue-900 hover:underline cursor-pointer ml-1 focus:ring-2 focus:ring-blue-600 focus:outline-none"
            >
              Limpiar
            </button>
          </div>
        )}
      </section>

      {/* TABLA DE TICKETS */}
      <section className="flex-1 min-h-0 px-3 sm:px-6 pb-2.5 flex flex-col">
        <div className="flex-1 min-h-0 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
          {/* ============ MÓVIL: lista de tarjetas (la tabla de 8 columnas no cabe) ============ */}
          <div className="flex-1 overflow-y-auto custom-scrollbar md:hidden">
            {paginatedTickets.length === 0 ? (
              <div className="py-12 px-4 text-center text-slate-400">
                <div className="flex flex-col items-center justify-center gap-2">
                  <span className="material-symbols-outlined text-4xl text-slate-300">inbox</span>
                  <p className="font-semibold text-slate-600 text-xs leading-relaxed">
                    No se encontraron tickets en esta bandeja o con los filtros aplicados
                  </p>
                  <button
                    onClick={onClearAllFilters}
                    className="mt-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  >
                    Limpiar filtros
                  </button>
                </div>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {paginatedTickets.map((ticket) => {
                  const isSelected = selectedIds.includes(ticket.id);
                  const isBreached = ticket.isBreached;
                  const slaBadge = formatSlaBadge(ticket);

                  return (
                    <li
                      key={ticket.id}
                      className={`px-3.5 py-3 transition-colors active:bg-blue-50/60 ${
                        isSelected
                          ? 'bg-blue-50/60'
                          : isBreached
                          ? 'bg-rose-50/25'
                          : ticket.status === 'Nuevo'
                          ? 'bg-amber-50/20'
                          : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Checkbox de selección */}
                        <input
                          type="checkbox"
                          aria-label={`Seleccionar ticket ${ticket.code}`}
                          checked={isSelected}
                          onChange={() => handleToggleRow(ticket.id)}
                          className="w-4 h-4 mt-0.5 rounded text-blue-600 accent-blue-600 flex-shrink-0 cursor-pointer focus:ring-2 focus:ring-blue-600 focus:outline-none"
                        />

                        <div className="flex-1 min-w-0 space-y-2">
                          {/* Fila 1: código + badges + SLA */}
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span
                              onClick={() => onSetVista('detalle', ticket.id)}
                              className={`font-mono font-bold text-xs hover:underline cursor-pointer ${
                                isBreached ? 'text-rose-600' : 'text-blue-700'
                              }`}
                            >
                              {ticket.code}
                            </span>
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border ${
                                ticket.priority === 'Crítica'
                                  ? 'bg-rose-100 text-rose-800 border-rose-200'
                                  : ticket.priority === 'Alta'
                                  ? 'bg-orange-100 text-orange-800 border-orange-200'
                                  : 'bg-slate-100 text-slate-700 border-slate-200'
                              }`}
                            >
                              {ticket.priority}
                            </span>
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${getStatusBadgeStyle(
                                ticket.status
                              )}`}
                            >
                              {ticket.status}
                            </span>
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold border ml-auto flex-shrink-0 ${slaBadge.bgClass} ${slaBadge.colorClass} ${slaBadge.borderClass}`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${slaBadge.dotClass}`} />
                              {slaBadge.text}
                            </span>
                          </div>

                          {/* Fila 2: asunto (toca para abrir el detalle) */}
                          <button
                            onClick={() => onSetVista('detalle', ticket.id)}
                            className="block w-full text-left text-sm font-semibold leading-snug text-slate-900 hover:text-blue-700 cursor-pointer focus:ring-2 focus:ring-blue-600 focus:outline-none rounded"
                          >
                            {ticket.title}
                          </button>

                          {/* Fila 3: empresa + categoría */}
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 min-w-0">
                            <span className="material-symbols-outlined text-xs text-slate-400 flex-shrink-0">
                              corporate_fare
                            </span>
                            <span className="font-medium text-slate-600 truncate">{ticket.company}</span>
                            <span className="flex-shrink-0">·</span>
                            <span className="truncate">{ticket.category}</span>
                          </div>

                          {/* Fila 4: agente + acciones */}
                          <div className="flex items-center justify-between gap-2 pt-1">
                            {ticket.assignedAgent ? (
                              <div className="flex items-center gap-1.5 min-w-0">
                                <img
                                  alt={ticket.assignedAgent.name}
                                  className="w-4 h-4 rounded-full object-cover ring-1 ring-slate-200 flex-shrink-0"
                                  src={ticket.assignedAgent.avatar}
                                />
                                <span className="text-[11px] text-slate-600 truncate">
                                  {ticket.assignedAgent.name}
                                </span>
                              </div>
                            ) : (
                              <span className="text-[11px] text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                                Sin asignar
                              </span>
                            )}

                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              {!ticket.assignedAgent && (
                                <button
                                  onClick={() => takeTicket(ticket.id)}
                                  className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 active:bg-amber-200 text-amber-800 text-[11px] font-semibold border border-amber-200 cursor-pointer transition-colors focus:ring-2 focus:ring-blue-600 focus:outline-none"
                                >
                                  Tomar
                                </button>
                              )}
                              <button
                                onClick={(e) => {
                                  const rect = e.currentTarget.getBoundingClientRect();
                                  setRowMenuTicket({
                                    ticket,
                                    x: rect.right - 210,
                                    y: rect.bottom + 4
                                  });
                                }}
                                className="p-1.5 -mr-1 rounded text-slate-400 hover:text-slate-800 hover:bg-slate-100 active:bg-slate-200 transition-colors cursor-pointer focus:ring-2 focus:ring-blue-600 focus:outline-none"
                                aria-label={`Más opciones para ${ticket.code}`}
                              >
                                <span className="material-symbols-outlined text-base">more_vert</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* ============ ESCRITORIO Y TABLET: tabla completa ============ */}
          <div className="hidden md:block flex-1 overflow-y-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-slate-100/95 backdrop-blur-xs border-b border-slate-200 z-10 select-none">
                <tr className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                  <th className="py-2.5 pl-3.5 pr-2 w-8">
                    <input
                      type="checkbox"
                      aria-label="Seleccionar todos los tickets de la página"
                      checked={allCurrentSelected}
                      ref={input => {
                        if (input) {
                          input.indeterminate = !allCurrentSelected && someCurrentSelected;
                        }
                      }}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="w-3.5 h-3.5 rounded text-blue-600 accent-blue-600 cursor-pointer focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    />
                  </th>
                  <th className="py-2.5 px-2.5 w-24">Ticket</th>
                  <th className="py-2.5 px-3 min-w-[280px]">Asunto y empresa</th>
                  <th className="py-2.5 px-2 text-center w-24">Prioridad</th>
                  <th className="py-2.5 px-2 text-center w-28">Estado</th>
                  <th className="py-2.5 px-3 min-w-[150px]">Asignado</th>
                  <th className="py-2.5 px-3 min-w-[140px]">SLA restante</th>
                  <th className="py-2.5 pr-3.5 pl-2 text-right w-20">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {paginatedTickets.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <span className="material-symbols-outlined text-4xl text-slate-300">inbox</span>
                        <p className="font-semibold text-slate-600 text-xs">
                          No se encontraron tickets en esta bandeja o con los filtros aplicados
                        </p>
                        <button
                          onClick={onClearAllFilters}
                          className="mt-1 px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer focus:ring-2 focus:ring-blue-600 focus:outline-none"
                        >
                          Limpiar filtros
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedTickets.map((ticket) => {
                    const isSelected = selectedIds.includes(ticket.id);
                    const isCritical = ticket.priority === 'Crítica';
                    const isBreached = ticket.isBreached;
                    const slaBadge = formatSlaBadge(ticket);

                    return (
                      <tr
                        key={ticket.id}
                        className={`transition-colors group ${
                          isSelected
                            ? 'bg-blue-50/60'
                            : isBreached
                            ? 'bg-rose-50/25 hover:bg-rose-50/40'
                            : ticket.status === 'Nuevo'
                            ? 'bg-amber-50/20 hover:bg-amber-50/30'
                            : 'hover:bg-blue-50/30'
                        }`}
                      >
                        {/* Checkbox por tarjeta */}
                        <td className="py-2 pl-3.5 pr-2">
                          <input
                            type="checkbox"
                            aria-label={`Seleccionar ticket ${ticket.code}`}
                            checked={isSelected}
                            onChange={() => handleToggleRow(ticket.id)}
                            className="w-3.5 h-3.5 rounded text-blue-600 accent-blue-600 cursor-pointer focus:ring-2 focus:ring-blue-600 focus:outline-none"
                          />
                        </td>

                        {/* ID (font-mono) */}
                        <td className="py-2 px-2.5 whitespace-nowrap">
                          <span
                            onClick={() => onSetVista('detalle', ticket.id)}
                            className={`font-mono font-bold hover:underline cursor-pointer ${
                              isBreached ? 'text-rose-600' : 'text-blue-700'
                            }`}
                          >
                            {ticket.code}
                          </span>
                        </td>

                        {/* Asunto y empresa */}
                        <td className="py-2 px-3">
                          <div className="flex flex-col leading-snug">
                            <span
                              onClick={() => onSetVista('detalle', ticket.id)}
                              className={`font-semibold cursor-pointer truncate max-w-md ${
                                isBreached
                                  ? 'text-rose-700 hover:text-rose-800'
                                  : 'text-slate-900 group-hover:text-blue-700'
                              }`}
                            >
                              {ticket.title}
                            </span>
                            <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                              <span className="material-symbols-outlined text-xs text-slate-400">corporate_fare</span>
                              <span className="font-medium text-slate-600 truncate max-w-[180px]">{ticket.company}</span>
                              <span>·</span>
                              <span className="text-slate-500">{ticket.category}</span>
                            </div>
                          </div>
                        </td>

                        {/* Prioridad */}
                        <td className="py-2 px-2 text-center whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${
                              isCritical
                                ? 'bg-rose-100 text-rose-800 border-rose-200'
                                : ticket.priority === 'Alta'
                                ? 'bg-orange-100 text-orange-800 border-orange-200'
                                : ticket.priority === 'Media'
                                ? 'bg-slate-100 text-slate-700 border-slate-200'
                                : 'bg-slate-100 text-slate-600 border-slate-200'
                            }`}
                          >
                            {ticket.priority}
                          </span>
                        </td>

                        {/* Estado */}
                        <td className="py-2 px-2 text-center whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${getStatusBadgeStyle(
                              ticket.status
                            )}`}
                          >
                            {ticket.status}
                          </span>
                        </td>

                        {/* Asignado */}
                        <td className="py-2 px-3 whitespace-nowrap">
                          {ticket.assignedAgent ? (
                            <div className="flex items-center gap-2">
                              <img
                                alt={ticket.assignedAgent.name}
                                className="w-5 h-5 rounded-full object-cover ring-1 ring-slate-200"
                                src={ticket.assignedAgent.avatar}
                              />
                              <span className="font-medium text-slate-800 text-xs truncate max-w-[120px]">
                                {ticket.assignedAgent.name}
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                              Sin asignar
                            </span>
                          )}
                        </td>

                        {/* SLA Restante */}
                        <td className="py-2 px-3 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-semibold border ${slaBadge.bgClass} ${slaBadge.colorClass} ${slaBadge.borderClass}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${slaBadge.dotClass}`}></span>
                            <span>{slaBadge.text}</span>
                          </span>
                        </td>

                        {/* Acciones */}
                        <td className="py-2 pr-3.5 pl-2 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            {!ticket.assignedAgent && (
                              <button
                                onClick={() => takeTicket(ticket.id)}
                                className="px-2 py-0.5 rounded bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-semibold border border-amber-200 cursor-pointer transition-colors focus:ring-2 focus:ring-blue-600 focus:outline-none"
                                title="Tomar ticket"
                              >
                                Tomar
                              </button>
                            )}
                            <button
                              onClick={(e) => {
                                const rect = e.currentTarget.getBoundingClientRect();
                                setRowMenuTicket({
                                  ticket,
                                  x: rect.right - 210,
                                  y: rect.bottom + 4
                                });
                              }}
                              className="p-1 rounded text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer focus:ring-2 focus:ring-blue-600 focus:outline-none"
                              title="Más opciones"
                            >
                              <span className="material-symbols-outlined text-base">more_vert</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Footer de Paginación */}
          <footer className="p-3 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs text-slate-600 flex-shrink-0 select-none">
            <div className="flex items-center gap-3 min-w-0">
              <span className="truncate">
                Mostrando <strong className="text-slate-900 font-semibold">{totalTickets === 0 ? 0 : (currentPage - 1) * pageSize + 1}</strong> a{' '}
                <strong className="text-slate-900 font-semibold">{Math.min(currentPage * pageSize, totalTickets)}</strong> de{' '}
                <strong className="text-slate-900 font-semibold">{totalTickets}</strong>
              </span>
              <div className="hidden sm:flex items-center gap-1.5 pl-3 border-l border-slate-200">
                <span>Por página:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="bg-white border border-slate-200 rounded px-1.5 py-0.5 text-xs text-slate-700 cursor-pointer focus:ring-2 focus:ring-blue-600 focus:outline-none"
                >
                  <option value={8}>8</option>
                  <option value={12}>12</option>
                  <option value={20}>20</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(1)}
                className="hidden sm:flex w-7 h-7 rounded items-center justify-center border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 active:bg-slate-200 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed transition-colors focus:ring-2 focus:ring-blue-600 focus:outline-none"
                title="Primera página"
              >
                <span className="material-symbols-outlined text-sm">first_page</span>
              </button>
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className="w-8 h-8 sm:w-7 sm:h-7 rounded flex items-center justify-center border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 active:bg-slate-200 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed transition-colors focus:ring-2 focus:ring-blue-600 focus:outline-none"
                title="Página anterior"
                aria-label="Página anterior"
              >
                <span className="material-symbols-outlined text-sm">chevron_left</span>
              </button>

              <span className="px-2 font-medium text-slate-700 whitespace-nowrap">
                {currentPage} / {totalPages}
              </span>

              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                className="w-8 h-8 sm:w-7 sm:h-7 rounded flex items-center justify-center border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 active:bg-slate-200 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed transition-colors focus:ring-2 focus:ring-blue-600 focus:outline-none"
                title="Página siguiente"
                aria-label="Página siguiente"
              >
                <span className="material-symbols-outlined text-sm">chevron_right</span>
              </button>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(totalPages)}
                className="hidden sm:flex w-7 h-7 rounded items-center justify-center border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 active:bg-slate-200 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed transition-colors focus:ring-2 focus:ring-blue-600 focus:outline-none"
                title="Última página"
              >
                <span className="material-symbols-outlined text-sm">last_page</span>
              </button>
            </div>
          </footer>
        </div>
      </section>

      {/* Row Action Menu Dropdown */}
      {rowMenuTicket && (
        <div
          ref={rowMenuRef}
          style={{ top: `${rowMenuTicket.y}px`, left: `${rowMenuTicket.x}px` }}
          className="fixed z-50 w-52 bg-white rounded-xl shadow-xl border border-slate-200 py-1 text-xs animate-in fade-in zoom-in-95 duration-100 select-none"
        >
          <div className="px-3 py-1.5 border-b border-slate-100 bg-slate-50">
            <span className="font-mono font-bold text-slate-900 block">{rowMenuTicket.ticket.code}</span>
            <span className="text-xs text-slate-500 block truncate">{rowMenuTicket.ticket.title}</span>
          </div>

          <button
            onClick={() => {
              const t = rowMenuTicket.ticket;
              setRowMenuTicket(null);
              onSetVista('detalle', t.id);
            }}
            className="w-full text-left px-3 py-1.5 hover:bg-slate-50 flex items-center gap-2 text-slate-700 cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm text-blue-600">open_in_new</span>
            <span>Ver detalle completo</span>
          </button>

          {!rowMenuTicket.ticket.assignedAgent && (
            <button
              onClick={() => {
                takeTicket(rowMenuTicket.ticket.id);
                setRowMenuTicket(null);
              }}
              className="w-full text-left px-3 py-1.5 hover:bg-slate-50 flex items-center gap-2 text-slate-700 cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm text-amber-600">person_add</span>
              <span>Asignar a mí</span>
            </button>
          )}

          <button
            onClick={() => {
              moveTicket(rowMenuTicket.ticket.id, 'Resuelto');
              setRowMenuTicket(null);
            }}
            className="w-full text-left px-3 py-1.5 hover:bg-slate-50 flex items-center gap-2 text-emerald-700 font-semibold cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm text-emerald-600">check_circle</span>
            <span>Marcar como resuelto</span>
          </button>

          <button
            onClick={() => {
              moveTicket(rowMenuTicket.ticket.id, 'En espera del cliente');
              setRowMenuTicket(null);
            }}
            className="w-full text-left px-3 py-1.5 hover:bg-slate-50 flex items-center gap-2 text-sky-700 cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm text-sky-600">hourglass_empty</span>
            <span>En espera del cliente</span>
          </button>
        </div>
      )}

      {/* Barra Flotante Inferior de Acciones por Lote */}
      <div
        className={`absolute bottom-4 sm:bottom-5 left-1/2 -translate-x-1/2 z-40 transition-all duration-300 pointer-events-auto max-w-[calc(100vw-1.5rem)] ${
          selectedIds.length > 0
            ? 'opacity-100 translate-y-0'
            : 'opacity-0 translate-y-10 pointer-events-none'
        }`}
      >
        <div className="bg-[#0B2A5B]/95 backdrop-blur-md text-white px-3 sm:px-4 py-2.5 rounded-xl shadow-xl border border-white/20 flex items-center gap-2 sm:gap-3 overflow-x-auto custom-scrollbar">
          <div className="flex items-center gap-2 pr-2 sm:pr-3 border-r border-white/20 flex-shrink-0">
            <span className="w-2 h-2 rounded-full bg-[#F37021] animate-pulse"></span>
            <span className="text-xs font-bold text-white tracking-tight whitespace-nowrap">
              {selectedIds.length} {selectedIds.length === 1 ? 'seleccionado' : 'seleccionados'}
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={triggerBulkAssign}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white transition-all cursor-pointer whitespace-nowrap flex-shrink-0 focus:ring-2 focus:ring-blue-400 focus:outline-none"
            >
              <span className="material-symbols-outlined text-sm">person_add</span>
              <span>Asignar</span>
            </button>

            <div className="relative flex-shrink-0">
              <button
                onClick={() => setStatusMenuOpen(!statusMenuOpen)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white transition-all cursor-pointer whitespace-nowrap focus:ring-2 focus:ring-blue-400 focus:outline-none"
              >
                <span className="material-symbols-outlined text-sm">published_with_changes</span>
                <span>Cambiar estado</span>
                <span className="material-symbols-outlined text-xs">arrow_drop_down</span>
              </button>

              {statusMenuOpen && (
                <div className="absolute bottom-full mb-2 left-0 w-48 bg-white text-slate-800 rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 text-xs animate-in fade-in slide-in-from-bottom-2">
                  <button
                    onClick={() => triggerBulkChangeStatus('En progreso')}
                    className="w-full text-left px-3 py-1.5 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                  >
                    <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                    <span>En progreso</span>
                  </button>
                  <button
                    onClick={() => triggerBulkChangeStatus('En espera del cliente')}
                    className="w-full text-left px-3 py-1.5 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                  >
                    <span className="w-2 h-2 rounded-full bg-sky-500"></span>
                    <span>En espera del cliente</span>
                  </button>
                  <button
                    onClick={() => triggerBulkChangeStatus('Asignado')}
                    className="w-full text-left px-3 py-1.5 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                  >
                    <span className="w-2 h-2 rounded-full bg-slate-500"></span>
                    <span>Asignado</span>
                  </button>
                  <button
                    onClick={() => triggerBulkChangeStatus('Resuelto')}
                    className="w-full text-left px-3 py-1.5 hover:bg-slate-50 text-emerald-700 font-semibold flex items-center gap-2 cursor-pointer"
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span>Marcar resuelto</span>
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={triggerBulkResolve}
              className="flex items-center gap-1 px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all shadow-xs cursor-pointer active:scale-95 focus:ring-2 focus:ring-blue-400 focus:outline-none"
            >
              <span className="material-symbols-outlined text-sm">check_circle</span>
              <span>Resolver</span>
            </button>
          </div>

          <div className="pl-2 border-l border-white/20">
            <button
              onClick={() => setSelectedIds([])}
              className="text-xs text-blue-200 hover:text-white underline underline-offset-2 transition-colors cursor-pointer"
            >
              Desmarcar
            </button>
          </div>
        </div>
      </div>

      {/* Diálogo de Confirmación para Acciones por Lote */}
      {confirmDialog && confirmDialog.isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-5 animate-in fade-in zoom-in-95 duration-150 pb-safe sm:pb-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-xl">help</span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">{confirmDialog.title}</h3>
                <p className="text-xs text-slate-500">Confirmación de acción por lote</p>
              </div>
            </div>

            <p className="text-xs text-slate-700 leading-relaxed mb-5">
              {confirmDialog.message}
            </p>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setConfirmDialog(null)}
                className="px-3.5 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleExecuteConfirmedAction}
                className="px-4 py-1.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer focus:ring-2 focus:ring-blue-600 focus:outline-none"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
