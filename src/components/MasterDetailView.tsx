import React, { useState, useMemo } from 'react';
import { Ticket, TicketStatus, NavigationFilters, VistaType } from '../types';
import { useTickets } from '../context/TicketsContext';
import { filterTicketsByNavigation, getBandejaTitle } from '../utils/filterTickets';
import { MACROS_PREDEFINIDAS, AGENTS_LIST } from '../data/mockData';
import { formatSlaBadge, getStatusBadgeStyle } from './TableView';

interface MasterDetailViewProps {
  filters: NavigationFilters;
  onSetVista: (vista: VistaType, ticketId?: string) => void;
  onSetFiltroRapido: (filtro: 'urgentes' | 'sla_riesgo' | 'esperando' | '') => void;
  onSetFilterParam: (key: keyof NavigationFilters, value: string) => void;
  onClearAllFilters: () => void;
  getVistaHref: (vista: VistaType) => string;
}

export const MasterDetailView: React.FC<MasterDetailViewProps> = ({
  filters,
  onSetVista,
  onSetFiltroRapido,
  onSetFilterParam,
  getVistaHref
}) => {
  const { tickets, currentUser, sendMessage, updateStatus, reassignAgent } = useTickets();

  // Inspector Tabs: Conversación | Historial | Relacionados (Requirement 10)
  const [inspectorTab, setInspectorTab] = useState<'conversacion' | 'historial' | 'relacionados'>('conversacion');

  // Compositor Tab: Respuesta al cliente | Nota interna (Requirement 9)
  const [compositorTab, setCompositorTab] = useState<'cliente' | 'interna'>('cliente');
  const [replyText, setReplyText] = useState('');
  const [showMacrosMenu, setShowMacrosMenu] = useState(false);
  const [showReassignModal, setShowReassignModal] = useState(false);

  // Requirement 3: Tabla, Detalle y Kanban aplican la misma bandeja y los mismos filtros
  const filteredList = useMemo(() => {
    return filterTicketsByNavigation(tickets, filters, currentUser);
  }, [tickets, filters, currentUser]);

  const activeCountInView = useMemo(() => {
    return filteredList.filter(t => t.status !== 'Resuelto' && t.status !== 'Cerrado').length;
  }, [filteredList]);

  // Ticket seleccionado: si está en URL (filters.ticketId), se usa ese; sino el primero de la lista o tickets[0]
  const selectedTicket: Ticket | null = useMemo(() => {
    if (filters.ticketId) {
      const found = tickets.find(t => t.id === filters.ticketId);
      if (found) return found;
      return null;
    }
    return filteredList[0] || null;
  }, [filters.ticketId, filteredList, tickets]);

  // Related tickets: misma empresa, excluyendo ticket actual
  const relatedTickets = useMemo(() => {
    if (!selectedTicket) return [];
    return tickets.filter(
      t => t.company === selectedTicket.company && t.id !== selectedTicket.id
    );
  }, [tickets, selectedTicket]);

  const handleSendReply = (resolveNow: boolean = false) => {
    if (!replyText.trim() || !selectedTicket) return;
    const isInternal = compositorTab === 'interna';
    sendMessage(selectedTicket.id, replyText.trim(), isInternal);
    if (resolveNow) {
      updateStatus(selectedTicket.id, 'Resuelto');
    }
    setReplyText('');
  };

  const selectedSlaBadge = selectedTicket ? formatSlaBadge(selectedTicket) : null;

  // En móvil el inspector ocupa toda la pantalla, pero solo cuando el usuario
  // ha abierto un ticket explícitamente. `selectedTicket` cae por defecto al
  // primer elemento de la lista, así que hay que mirar el ticketId de la URL:
  // si no, la lista nunca se vería en el móvil.
  const hasExplicitSelection = Boolean(filters.ticketId && selectedTicket && selectedTicket.id === filters.ticketId);

  return (
    <div className="flex-1 flex flex-row min-h-0 h-full overflow-hidden select-none bg-[#F5F7FB] dark:bg-[#081B3A] transition-colors duration-200">
      {/* ================= PANEL CENTRAL (60%): BANDEJA / LISTA DE TICKETS ================= */}
      <section
        className={`w-full lg:w-[58%] xl:w-[60%] flex flex-col h-full bg-[#F5F7FB] dark:bg-[#081B3A] overflow-hidden lg:border-r lg:border-slate-200 dark:lg:border-[#1E3F73] transition-colors ${
          hasExplicitSelection ? 'hidden lg:flex' : 'flex'
        }`}
      >
        {/* Header de la Bandeja: Título según ?bandeja + Contador de activos + Selector de Vistas */}
        <div className="p-3 sm:p-3.5 bg-white dark:bg-[#0E2A52] border-b border-slate-200 dark:border-[#1E3F73] flex-shrink-0 space-y-2.5 transition-colors">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-[#E8EEF9] tracking-tight truncate">
                {getBandejaTitle(filters.bandeja)}
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700/60 text-xs font-semibold flex-shrink-0">
                {activeCountInView} activos
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              {/* Selector de vistas con links que conservan bandeja y filtros (Requirement 2 & 3) */}
              <div className="flex items-center bg-slate-100 dark:bg-[#081B3A] p-0.5 rounded-xl border border-slate-200 dark:border-[#1E3F73] text-xs flex-shrink-0 transition-colors">
                <a
                  href={getVistaHref('tabla')}
                  onClick={(e) => {
                    e.preventDefault();
                    onSetVista('tabla');
                  }}
                  className={`px-2.5 py-1 rounded-lg font-medium flex items-center gap-1 transition-colors cursor-pointer focus:ring-2 focus:ring-blue-600 focus:outline-none no-underline ${
                    filters.vista === 'tabla'
                      ? 'bg-white dark:bg-[#0E2A52] text-blue-700 dark:text-blue-400 shadow-xs font-semibold'
                      : 'text-slate-600 dark:text-[#94A9CC] hover:text-slate-900 dark:hover:text-[#E8EEF9]'
                  }`}
                  title="Cambiar a vista tabla"
                >
                  <span className="material-symbols-outlined text-sm">table_rows</span>
                  <span className="hidden sm:inline">Tabla</span>
                </a>
                <a
                  href={getVistaHref('detalle')}
                  onClick={(e) => {
                    e.preventDefault();
                    onSetVista('detalle');
                  }}
                  className={`px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1 focus:ring-2 focus:ring-blue-600 focus:outline-none no-underline ${
                    filters.vista === 'detalle'
                      ? 'bg-white dark:bg-[#0E2A52] text-blue-700 dark:text-blue-400 shadow-xs'
                      : 'text-slate-600 dark:text-[#94A9CC] hover:text-slate-900 dark:hover:text-[#E8EEF9]'
                  }`}
                  title="Vista detalle activa"
                >
                  <span className="material-symbols-outlined text-sm">view_sidebar</span>
                  <span className="hidden sm:inline">Detalle</span>
                </a>
                <a
                  href={getVistaHref('kanban')}
                  onClick={(e) => {
                    e.preventDefault();
                    onSetVista('kanban');
                  }}
                  className={`px-2.5 py-1 rounded-lg font-medium flex items-center gap-1 transition-colors cursor-pointer focus:ring-2 focus:ring-blue-600 focus:outline-none no-underline ${
                    filters.vista === 'kanban'
                      ? 'bg-white dark:bg-[#0E2A52] text-blue-700 dark:text-blue-400 shadow-xs font-semibold'
                      : 'text-slate-600 dark:text-[#94A9CC] hover:text-slate-900 dark:hover:text-[#E8EEF9]'
                  }`}
                  title="Cambiar a tablero kanban"
                >
                  <span className="material-symbols-outlined text-sm">view_kanban</span>
                  <span className="hidden sm:inline">Kanban</span>
                </a>
              </div>
            </div>
          </div>

          {/* Buscador local */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-2.5 top-2 text-slate-400 dark:text-[#94A9CC] text-sm">
                search
              </span>
              <input
                value={filters.busqueda || ''}
                onChange={(e) => onSetFilterParam('busqueda', e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-[#081B3A] border border-slate-200 dark:border-[#1E3F73] rounded-lg text-xs text-slate-900 dark:text-[#E8EEF9] placeholder:text-slate-400 dark:placeholder:text-[#94A9CC]/60 focus:bg-white dark:focus:bg-[#081B3A] focus:border-blue-600 focus:ring-2 focus:ring-blue-600 focus:outline-none font-sans transition-colors"
                placeholder="Buscar por ID, asunto o solicitante..."
                type="text"
              />
            </div>
          </div>

          {/* Requirement 4: Filtros rápidos EXCLUSIVAMENTE Urgentes, SLA en riesgo, Esperando cliente */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 text-nowrap custom-scrollbar">
            <button
              onClick={() => onSetFiltroRapido(filters.filtroRapido === 'urgentes' ? '' : 'urgentes')}
              className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer focus:ring-2 focus:ring-blue-600 focus:outline-none ${
                filters.filtroRapido === 'urgentes'
                  ? 'bg-rose-700 text-white shadow-xs'
                  : 'bg-white dark:bg-[#0E2A52] border border-slate-200 dark:border-[#1E3F73] text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40'
              }`}
            >
              <span className="material-symbols-outlined text-xs">warning</span>
              <span>Urgentes</span>
            </button>

            <button
              onClick={() => onSetFiltroRapido(filters.filtroRapido === 'sla_riesgo' ? '' : 'sla_riesgo')}
              className={`px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer focus:ring-2 focus:ring-blue-600 focus:outline-none ${
                filters.filtroRapido === 'sla_riesgo'
                  ? 'bg-amber-600 text-white font-semibold shadow-xs'
                  : 'bg-white dark:bg-[#0E2A52] border border-slate-200 dark:border-[#1E3F73] text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40'
              }`}
            >
              <span className="material-symbols-outlined text-xs">alarm</span>
              <span>SLA en riesgo</span>
            </button>

            <button
              onClick={() => onSetFiltroRapido(filters.filtroRapido === 'esperando' ? '' : 'esperando')}
              className={`px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer focus:ring-2 focus:ring-blue-600 focus:outline-none ${
                filters.filtroRapido === 'esperando'
                  ? 'bg-sky-600 text-white font-semibold shadow-xs'
                  : 'bg-white dark:bg-[#0E2A52] border border-slate-200 dark:border-[#1E3F73] text-sky-700 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/40'
              }`}
            >
              <span className="material-symbols-outlined text-xs">hourglass_empty</span>
              <span>Esperando cliente</span>
            </button>

            {filters.filtroRapido && (
              <button
                onClick={() => onSetFiltroRapido('')}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-semibold ml-1 cursor-pointer"
              >
                Limpiar
              </button>
            )}
          </div>
        </div>

        {/* Lista Desplazable de Tarjetas de Tickets */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-3.5 space-y-2.5 custom-scrollbar">
          {filteredList.length === 0 ? (
            <div className="text-center py-16 text-slate-400 dark:text-[#94A9CC]">
              <span className="material-symbols-outlined text-4xl text-slate-300 dark:text-[#94A9CC]/50">inbox</span>
              <p className="mt-2 text-xs font-semibold text-slate-600 dark:text-[#E8EEF9]">No hay tickets en este segmento</p>
            </div>
          ) : (
            filteredList.map((ticket) => {
              const isSelected = Boolean(selectedTicket && ticket.id === selectedTicket.id);
              const selectedHighlight = 'border-blue-600 dark:border-blue-500 ring-2 ring-blue-600/20 shadow-sm';
              const selectedHighlightDesktopOnly = 'lg:border-blue-600 lg:border-blue-500 lg:ring-2 lg:ring-blue-600/20 lg:shadow-sm';
              const neutralCard = 'bg-white dark:bg-[#0E2A52] border-slate-200 dark:border-[#1E3F73] hover:border-slate-300 dark:hover:border-[#2a5596] hover:shadow-xs';

              const cardStateClass = !isSelected
                ? neutralCard
                : hasExplicitSelection
                  ? `bg-white dark:bg-[#0E2A52] ${selectedHighlight}`
                  : `${neutralCard} ${selectedHighlightDesktopOnly}`;

              const isCritical = ticket.priority === 'Crítica';
              const slaBadge = formatSlaBadge(ticket);

              return (
                <div
                  key={ticket.id}
                  onClick={() => onSetFilterParam('ticketId', ticket.id)}
                  className={`p-3 sm:p-3.5 rounded-xl border transition-all cursor-pointer relative shadow-2xs active:bg-slate-50 dark:active:bg-[#081B3A] ${cardStateClass}`}
                >
                  {/* Indicador lateral azul para seleccionado */}
                  {isSelected && (
                    <div className={`absolute left-0 top-3 bottom-3 w-1 bg-blue-600 dark:bg-blue-500 rounded-r-md ${hasExplicitSelection ? '' : 'hidden lg:block'}`} />
                  )}

                  <div className="flex items-center justify-between gap-2 mb-1.5 pl-1.5 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-blue-700 dark:text-blue-400">
                        {ticket.code || ticket.id}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-semibold border ${
                          isCritical
                            ? 'bg-rose-100 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800/50'
                            : ticket.priority === 'Alta'
                            ? 'bg-orange-100 dark:bg-orange-950/40 text-orange-800 dark:text-orange-300 border-orange-200 dark:border-orange-800/50'
                            : 'bg-slate-100 dark:bg-[#081B3A] text-slate-700 dark:text-[#E8EEF9] border-slate-200 dark:border-[#1E3F73]'
                        }`}
                      >
                        {ticket.priority}
                      </span>
                      {/* Cada tarjeta muestra su estado (Requirement 11) */}
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${getStatusBadgeStyle(
                          ticket.status
                        )}`}
                      >
                        {ticket.status}
                      </span>
                    </div>

                    {/* SLA Restante en un solo formato ("2 h 15 min") */}
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold border ${slaBadge.bgClass} ${slaBadge.colorClass} ${slaBadge.borderClass}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${slaBadge.dotClass}`} />
                      <span className="font-mono">{slaBadge.text}</span>
                    </span>
                  </div>

                  <h3 className="text-xs font-semibold text-slate-900 dark:text-[#E8EEF9] leading-snug line-clamp-2 pl-1.5 mb-2">
                    {ticket.title}
                  </h3>

                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-[#94A9CC] pl-1.5 pt-1.5 border-t border-slate-100 dark:border-[#1E3F73]">
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="material-symbols-outlined text-xs text-slate-400 dark:text-[#94A9CC]">corporate_fare</span>
                      <span className="font-medium text-slate-700 dark:text-[#E8EEF9] truncate">{ticket.company}</span>
                    </div>
                    <span className="text-slate-400 dark:text-[#94A9CC] flex-shrink-0 ml-2">{ticket.createdHoursAgo}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* ================= PANEL DERECHO (40%): INSPECTOR DETALLADO ================= */}
      {selectedTicket && (
        <aside
          className={`w-full lg:w-[42%] xl:w-[40%] flex-col h-full bg-white dark:bg-[#0E2A52] overflow-hidden flex-shrink-0 shadow-lg lg:border-l lg:border-slate-200 dark:lg:border-[#1E3F73] transition-colors ${
            hasExplicitSelection ? 'flex' : 'hidden lg:flex'
          }`}
        >
          {/* Cabecera del Inspector */}
          <div className="p-3 sm:p-4 border-b border-slate-200 dark:border-[#1E3F73] flex-shrink-0 space-y-2 transition-colors">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-mono text-sm font-bold text-blue-700 dark:text-blue-400 flex-shrink-0">
                  {selectedTicket.code || selectedTicket.id}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-semibold border flex-shrink-0 ${getStatusBadgeStyle(
                    selectedTicket.status
                  )}`}
                >
                  {selectedTicket.status}
                </span>
              </div>

              <div className="flex items-center gap-1 flex-shrink-0">
                {/* Volver a la lista: solo en móvil, donde el inspector es pantalla completa */}
                <button
                  onClick={() => onSetFilterParam('ticketId', '')}
                  className="lg:hidden p-1.5 rounded-lg text-slate-500 dark:text-[#94A9CC] hover:text-slate-800 dark:hover:text-[#E8EEF9] hover:bg-slate-100 dark:hover:bg-[#081B3A] active:bg-slate-200 dark:active:bg-[#1E3F73] cursor-pointer transition-colors focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  title="Volver a la lista"
                  aria-label="Volver a la lista de tickets"
                >
                  <span className="material-symbols-outlined text-xl leading-none block">arrow_back</span>
                </button>

                <a
                  href={getVistaHref('tabla')}
                  onClick={(e) => {
                    e.preventDefault();
                    onSetVista('tabla');
                  }}
                  className="hidden lg:flex p-1 rounded text-slate-400 dark:text-[#94A9CC] hover:text-slate-700 dark:hover:text-[#E8EEF9] hover:bg-slate-100 dark:hover:bg-[#081B3A] cursor-pointer transition-colors focus:ring-2 focus:ring-blue-600 focus:outline-none no-underline"
                  title="Volver a tabla general"
                >
                  <span className="material-symbols-outlined text-base">close</span>
                </a>
              </div>
            </div>

            <h2 className="text-sm font-bold text-slate-900 dark:text-[#E8EEF9] leading-snug">
              {selectedTicket.title}
            </h2>

            {/* Tarjeta de SLA Restante Unificado ("2 h 15 min") (Requirement 12) */}
            {selectedSlaBadge && (
              <div
                className={`p-3 rounded-xl border flex items-center justify-between shadow-2xs ${selectedSlaBadge.bgClass} ${selectedSlaBadge.borderClass}`}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      selectedTicket.isBreached || selectedTicket.slaMinutesRemaining <= 0
                        ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                        : selectedTicket.slaRemainingPercent < 20
                        ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                        : selectedTicket.slaRemainingPercent <= 50
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                        : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                    }`}
                  >
                    <span className="material-symbols-outlined text-base">schedule</span>
                  </div>
                  <div>
                    <span className="text-xs uppercase font-bold text-slate-600 dark:text-[#94A9CC] tracking-wider block">
                      Límite SLA de resolución
                    </span>
                    <span className="text-xs font-semibold text-slate-900 dark:text-[#E8EEF9]">
                      {selectedTicket.slaLimit}
                    </span>
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <span className={`text-sm font-bold block leading-tight ${selectedSlaBadge.colorClass}`}>
                    {selectedSlaBadge.text}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-[#94A9CC]">
                    {selectedTicket.status === 'Resuelto' || selectedTicket.status === 'Cerrado'
                      ? 'Registrado'
                      : 'Restante'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Ficha de Información: Categoría, Etiquetas y Estado (Requirement 10) */}
          <div className="px-3 sm:px-4 py-3 bg-slate-50 dark:bg-[#081B3A] border-b border-slate-200 dark:border-[#1E3F73] text-xs space-y-2 flex-shrink-0 transition-colors">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-slate-400 dark:text-[#94A9CC] block text-[11px]">Empresa</span>
                <span className="font-semibold text-slate-900 dark:text-[#E8EEF9]">{selectedTicket.company}</span>
              </div>
              <div>
                <span className="text-slate-400 dark:text-[#94A9CC] block text-[11px]">Solicitante</span>
                <span className="font-semibold text-slate-900 dark:text-[#E8EEF9]">{selectedTicket.requesterName}</span>
              </div>
              <div>
                <span className="text-slate-400 dark:text-[#94A9CC] block text-[11px]">Categoría</span>
                <span className="font-semibold text-blue-700 dark:text-blue-400">{selectedTicket.category}</span>
              </div>
              <div>
                <span className="text-slate-400 dark:text-[#94A9CC] block text-[11px]">Módulo</span>
                <span className="font-medium text-slate-800 dark:text-[#E8EEF9]">{selectedTicket.module}</span>
              </div>
            </div>

            {/* Etiquetas */}
            <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-slate-200/60 dark:border-[#1E3F73]">
              <span className="text-slate-400 dark:text-[#94A9CC] text-[11px] mr-1">Etiquetas:</span>
              {selectedTicket.tags.map(tag => (
                <span
                  key={tag}
                  className="px-2 py-0.5 rounded text-[11px] font-medium bg-white dark:bg-[#0E2A52] border border-slate-200 dark:border-[#1E3F73] text-slate-700 dark:text-[#E8EEF9]"
                >
                  #{tag}
                </span>
              ))}
            </div>

            {/* Agente Asignado & Reasignación */}
            <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-[#1E3F73]">
              <div className="flex items-center gap-2">
                {selectedTicket.assignedAgent ? (
                  <>
                    <img
                      alt={selectedTicket.assignedAgent.name}
                      className="w-6 h-6 rounded-full object-cover ring-1 ring-slate-200 dark:ring-[#1E3F73]"
                      src={selectedTicket.assignedAgent.avatar}
                    />
                    <span className="font-medium text-slate-800 dark:text-[#E8EEF9] text-xs">
                      {selectedTicket.assignedAgent.name}
                    </span>
                  </>
                ) : (
                  <span className="text-xs text-amber-800 dark:text-amber-300 font-semibold bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800/50">
                    Sin asignar
                  </span>
                )}
              </div>

              <div className="relative">
                <button
                  onClick={() => setShowReassignModal(!showReassignModal)}
                  className="px-2 py-1 text-xs border border-slate-200 dark:border-[#1E3F73] hover:bg-white dark:hover:bg-[#0E2A52] rounded-lg font-semibold text-slate-700 dark:text-[#E8EEF9] flex items-center gap-1 cursor-pointer transition-colors focus:ring-2 focus:ring-blue-600 focus:outline-none"
                >
                  <span className="material-symbols-outlined text-sm">swap_horiz</span>
                  <span>Reasignar</span>
                </button>

                {showReassignModal && (
                  <div className="absolute right-0 bottom-full mb-1 w-52 max-w-[calc(100vw-2rem)] bg-white dark:bg-[#0E2A52] border border-slate-200 dark:border-[#1E3F73] rounded-xl shadow-xl py-1 z-30 text-xs animate-in fade-in slide-in-from-bottom-2">
                    <span className="px-3 py-1 text-xs uppercase font-bold text-slate-400 dark:text-[#94A9CC] block border-b border-slate-100 dark:border-[#1E3F73]">
                      Seleccionar agente
                    </span>
                    {AGENTS_LIST.map(agentName => (
                      <button
                        key={agentName}
                        onClick={() => {
                          reassignAgent(selectedTicket.id, agentName);
                          setShowReassignModal(false);
                        }}
                        className="w-full text-left px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-[#081B3A] text-slate-800 dark:text-[#E8EEF9] flex items-center gap-2 cursor-pointer transition-colors"
                      >
                        <span>{agentName}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Pestañas del Inspector: Conversación | Historial | Relacionados (Requirement 10) */}
          <div className="flex border-b border-slate-200 dark:border-[#1E3F73] bg-white dark:bg-[#0E2A52] px-2 sm:px-4 text-xs font-semibold flex-shrink-0 overflow-x-auto custom-scrollbar transition-colors">
            <button
              onClick={() => setInspectorTab('conversacion')}
              className={`py-2.5 px-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 focus:ring-2 focus:ring-blue-600 focus:outline-none ${
                inspectorTab === 'conversacion'
                  ? 'border-blue-600 dark:border-blue-400 text-blue-700 dark:text-blue-400'
                  : 'border-transparent text-slate-500 dark:text-[#94A9CC] hover:text-slate-800 dark:hover:text-[#E8EEF9]'
              }`}
            >
              <span className="material-symbols-outlined text-base">forum</span>
              <span>Conversación</span>
              <span className="px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-[#081B3A] text-slate-600 dark:text-[#94A9CC] text-[11px]">
                {selectedTicket.messages.length}
              </span>
            </button>

            <button
              onClick={() => setInspectorTab('historial')}
              className={`py-2.5 px-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 focus:ring-2 focus:ring-blue-600 focus:outline-none ${
                inspectorTab === 'historial'
                  ? 'border-blue-600 dark:border-blue-400 text-blue-700 dark:text-blue-400'
                  : 'border-transparent text-slate-500 dark:text-[#94A9CC] hover:text-slate-800 dark:hover:text-[#E8EEF9]'
              }`}
            >
              <span className="material-symbols-outlined text-base">history</span>
              <span>Historial</span>
              <span className="px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-[#081B3A] text-slate-600 dark:text-[#94A9CC] text-[11px]">
                {selectedTicket.history?.length || 0}
              </span>
            </button>

            <button
              onClick={() => setInspectorTab('relacionados')}
              className={`py-2.5 px-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 focus:ring-2 focus:ring-blue-600 focus:outline-none ${
                inspectorTab === 'relacionados'
                  ? 'border-blue-600 dark:border-blue-400 text-blue-700 dark:text-blue-400'
                  : 'border-transparent text-slate-500 dark:text-[#94A9CC] hover:text-slate-800 dark:hover:text-[#E8EEF9]'
              }`}
            >
              <span className="material-symbols-outlined text-base">link</span>
              <span>Relacionados</span>
              <span className="px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-[#081B3A] text-slate-600 dark:text-[#94A9CC] text-[11px]">
                {relatedTickets.length}
              </span>
            </button>
          </div>

          {/* Contenido según pestaña activa */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 custom-scrollbar">
            {inspectorTab === 'conversacion' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-[#94A9CC] pb-1">
                  <span className="font-semibold text-slate-700 dark:text-[#E8EEF9]">
                    {selectedTicket.messages.length === 1
                      ? '1 mensaje registrado'
                      : `${selectedTicket.messages.length} mensajes registrados`}
                  </span>
                </div>

                {selectedTicket.messages.length === 0 ? (
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#081B3A] text-center text-slate-400 dark:text-[#94A9CC] text-xs">
                    No hay mensajes aún en este ticket. Sé el primero en responder.
                  </div>
                ) : (
                  selectedTicket.messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`p-3.5 rounded-xl border text-xs leading-relaxed space-y-1.5 shadow-2xs transition-colors ${
                        msg.isInternal
                          ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/50 text-amber-950 dark:text-amber-200'
                          : msg.senderRole === 'soporte'
                          ? 'bg-blue-50/70 dark:bg-blue-950/40 border-blue-100 dark:border-blue-900/50 text-slate-800 dark:text-[#E8EEF9]'
                          : 'bg-slate-50 dark:bg-[#081B3A] border-slate-200 dark:border-[#1E3F73] text-slate-800 dark:text-[#E8EEF9]'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold flex items-center gap-1.5">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              msg.isInternal
                                ? 'bg-amber-500'
                                : msg.senderRole === 'soporte'
                                ? 'bg-emerald-500 dark:bg-emerald-400'
                                : 'bg-blue-500 dark:bg-blue-400'
                            }`}
                          />
                          {msg.senderName}
                          {msg.isInternal && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[11px] bg-amber-200 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 font-semibold">
                              <span className="material-symbols-outlined text-[12px]">lock</span>
                              Nota interna
                            </span>
                          )}
                        </span>
                        <span className="text-slate-400 dark:text-[#94A9CC] font-medium">{msg.time}</span>
                      </div>

                      <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>

                      {msg.attachment && (
                        <div className="pt-1.5 flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white dark:bg-[#0E2A52] border border-slate-200 dark:border-[#1E3F73] text-xs text-slate-700 dark:text-[#E8EEF9] hover:text-blue-700 dark:hover:text-blue-400 cursor-pointer shadow-xs transition-colors">
                            <span className="material-symbols-outlined text-xs">attach_file</span>
                            {msg.attachment.name} ({msg.attachment.size})
                          </span>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {inspectorTab === 'historial' && (
              <div className="space-y-3">
                <span className="text-xs font-semibold text-slate-700 dark:text-[#E8EEF9] block mb-2">
                  Línea de tiempo de cambios
                </span>
                {(!selectedTicket.history || selectedTicket.history.length === 0) ? (
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#081B3A] text-center text-slate-400 dark:text-[#94A9CC] text-xs">
                    No hay eventos registrados en el historial.
                  </div>
                ) : (
                  <div className="relative pl-5 border-l-2 border-slate-200 dark:border-[#1E3F73] space-y-4 my-2">
                    {selectedTicket.history.map((evt) => (
                      <div key={evt.id} className="relative text-xs">
                        <span className="absolute -left-[27px] top-0.5 w-3 h-3 rounded-full bg-blue-600 ring-4 ring-white dark:ring-[#0E2A52]" />
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-900 dark:text-[#E8EEF9]">{evt.action}</span>
                          <span className="text-slate-400 dark:text-[#94A9CC] font-medium">{evt.time}</span>
                        </div>
                        <p className="text-slate-600 dark:text-[#94A9CC] mt-0.5 leading-snug">{evt.detail}</p>
                        <span className="text-[11px] text-slate-400 dark:text-[#94A9CC] font-medium">Por: {evt.user}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {inspectorTab === 'relacionados' && (
              <div className="space-y-2.5">
                <div className="text-xs text-slate-500 dark:text-[#94A9CC] mb-2">
                  Tickets de la misma empresa (<strong className="text-slate-800 dark:text-[#E8EEF9]">{selectedTicket.company}</strong>):
                </div>
                {relatedTickets.length === 0 ? (
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#081B3A] text-center text-slate-400 dark:text-[#94A9CC] text-xs">
                    No hay otros tickets registrados para esta empresa.
                  </div>
                ) : (
                  relatedTickets.map((rel) => {
                    const relSla = formatSlaBadge(rel);
                    return (
                      <div
                        key={rel.id}
                        onClick={() => onSetFilterParam('ticketId', rel.id)}
                        className="p-3 rounded-xl border border-slate-200 dark:border-[#1E3F73] hover:border-blue-400 dark:hover:border-blue-400 hover:bg-slate-50/50 dark:hover:bg-[#081B3A]/50 transition-all cursor-pointer text-xs bg-white dark:bg-[#0E2A52]"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-mono font-bold text-blue-700 dark:text-blue-400">{rel.code}</span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${getStatusBadgeStyle(
                              rel.status
                            )}`}
                          >
                            {rel.status}
                          </span>
                        </div>
                        <h4 className="font-semibold text-slate-900 dark:text-[#E8EEF9] line-clamp-1 mb-1">{rel.title}</h4>
                        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-[#94A9CC]">
                          <span>{rel.category}</span>
                          <span className={`font-semibold ${relSla.colorClass}`}>{relSla.text}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>

          {/* Compositor con Pestañas: [Respuesta al cliente] | [Nota interna] (Requirement 9) */}
          <div className="p-3.5 border-t border-slate-200 dark:border-[#1E3F73] bg-slate-50 dark:bg-[#081B3A] flex-shrink-0 transition-colors">
            <div className="space-y-2">
              {/* Pestañas del Compositor */}
              <div className="flex items-center justify-between">
                <div className="inline-flex p-0.5 bg-slate-200/80 dark:bg-[#0E2A52] rounded-xl text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setCompositorTab('cliente')}
                    className={`px-3 py-1 rounded-lg transition-all cursor-pointer focus:ring-2 focus:ring-blue-600 focus:outline-none ${
                      compositorTab === 'cliente'
                        ? 'bg-white dark:bg-[#081B3A] text-blue-700 dark:text-blue-400 shadow-xs'
                        : 'text-slate-600 dark:text-[#94A9CC] hover:text-slate-900 dark:hover:text-[#E8EEF9]'
                    }`}
                  >
                    Respuesta al cliente
                  </button>
                  <button
                    type="button"
                    onClick={() => setCompositorTab('interna')}
                    className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer focus:ring-2 focus:ring-blue-600 focus:outline-none ${
                      compositorTab === 'interna'
                        ? 'bg-amber-100 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 shadow-xs'
                        : 'text-slate-600 dark:text-[#94A9CC] hover:text-slate-900 dark:hover:text-[#E8EEF9]'
                    }`}
                  >
                    <span className="material-symbols-outlined text-xs">lock</span>
                    <span>Nota interna</span>
                  </button>
                </div>

                {/* Aviso para nota interna */}
                {compositorTab === 'interna' && (
                  <span className="inline-flex items-center gap-1 text-[11px] text-amber-800 dark:text-amber-300 font-semibold bg-amber-100 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/60 px-2 py-0.5 rounded-full">
                    <span className="material-symbols-outlined text-xs">visibility_off</span>
                    <span>Solo visible para SFS</span>
                  </span>
                )}
              </div>

              {/* Área de texto con diseño según pestaña */}
              <div className="relative">
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                      handleSendReply(false);
                    }
                  }}
                  className={`w-full h-24 sm:h-20 p-2.5 border rounded-xl text-[16px] sm:text-xs text-slate-800 dark:text-[#E8EEF9] placeholder:text-slate-400 dark:placeholder:text-[#94A9CC]/60 focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none shadow-xs font-sans transition-colors ${
                    compositorTab === 'interna'
                      ? 'border-amber-300 dark:border-amber-700/60 bg-amber-50/80 dark:bg-amber-950/30 text-amber-950 dark:text-amber-100 focus:border-amber-500'
                      : 'border-slate-200 dark:border-[#1E3F73] bg-white dark:bg-[#0E2A52] focus:border-blue-600'
                  }`}
                  placeholder={
                    compositorTab === 'interna'
                      ? 'Escribe una nota interna para el equipo técnico SFS...'
                      : 'Escribe una respuesta para el cliente (Ctrl + Enter para enviar)...'
                  }
                />
              </div>

              {/* Barra de Acciones del Compositor */}
              <div className="flex items-center justify-between gap-2 pt-1 flex-wrap">
                <div className="flex items-center gap-1.5 text-slate-500 dark:text-[#94A9CC] relative">
                  {/* Botón Respuestas Predefinidas con Menú de Macros (Requirement 9) */}
                  <button
                    type="button"
                    onClick={() => setShowMacrosMenu(!showMacrosMenu)}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg border border-slate-200 dark:border-[#1E3F73] bg-white dark:bg-[#0E2A52] hover:bg-slate-100 dark:hover:bg-[#081B3A] text-xs text-slate-700 dark:text-[#E8EEF9] cursor-pointer transition-colors focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    title="Insertar respuesta predefinida"
                  >
                    <span className="material-symbols-outlined text-sm text-blue-600 dark:text-blue-400">text_snippet</span>
                    <span className="hidden sm:inline">Respuestas predefinidas</span>
                  </button>

                  {/* Menú de Macros */}
                  {showMacrosMenu && (
                    <div className="absolute left-0 bottom-full mb-1 w-72 max-w-[calc(100vw-2rem)] bg-white dark:bg-[#0E2A52] rounded-xl shadow-xl border border-slate-200 dark:border-[#1E3F73] p-1.5 z-40 text-xs animate-in fade-in slide-in-from-bottom-2">
                      <span className="px-2.5 py-1 text-[11px] uppercase font-bold text-slate-400 dark:text-[#94A9CC] block border-b border-slate-100 dark:border-[#1E3F73]">
                        Macros de respuesta rápida
                      </span>
                      <div className="divide-y divide-slate-100 dark:divide-[#1E3F73] max-h-48 overflow-y-auto custom-scrollbar">
                        {MACROS_PREDEFINIDAS.map((macro) => (
                          <button
                            key={macro.id}
                            type="button"
                            onClick={() => {
                              setReplyText(macro.text);
                              setShowMacrosMenu(false);
                            }}
                            className="w-full text-left p-2 hover:bg-blue-50 dark:hover:bg-[#081B3A] rounded-lg text-slate-800 dark:text-[#E8EEF9] transition-colors cursor-pointer"
                          >
                            <span className="font-semibold block text-blue-700 dark:text-blue-400">{macro.label}</span>
                            <span className="text-[11px] text-slate-500 dark:text-[#94A9CC] line-clamp-2 mt-0.5 leading-snug">
                              {macro.text}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Adjuntar Archivo */}
                  <button
                    type="button"
                    onClick={() => setReplyText(t => t + ' [Registro diagnóstico adjuntado]')}
                    className="p-2 -ml-1 hover:text-slate-700 dark:hover:text-[#E8EEF9] rounded-md hover:bg-white dark:hover:bg-[#0E2A52] active:bg-slate-100 dark:active:bg-[#081B3A] cursor-pointer transition-colors focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    title="Adjuntar archivo"
                  >
                    <span className="material-symbols-outlined text-base">attach_file</span>
                  </button>
                </div>

                {/* Botones de Envío según Pestaña (Requirement 9 & 16) */}
                <div className="flex items-center gap-2">
                  {compositorTab === 'interna' ? (
                    /* Botón Guardar Nota para Nota Interna */
                    <button
                      type="button"
                      onClick={() => handleSendReply(false)}
                      className="px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1 cursor-pointer active:scale-95 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    >
                      <span className="material-symbols-outlined text-sm">lock</span>
                      <span>Guardar nota</span>
                    </button>
                  ) : (
                    <>
                      {/* "Enviar" en secundario (Requirement 16) */}
                      <button
                        type="button"
                        onClick={() => handleSendReply(false)}
                        className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-[#0E2A52] hover:bg-slate-200 dark:hover:bg-[#1E3F73] text-slate-700 dark:text-[#E8EEF9] border border-slate-300 dark:border-[#1E3F73] text-xs font-semibold shadow-2xs transition-all flex items-center gap-1 cursor-pointer active:scale-95 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                      >
                        <span className="material-symbols-outlined text-sm">send</span>
                        <span>Enviar</span>
                      </button>

                      {/* "Enviar y resolver" en azul rey (Requirement 16) */}
                      <button
                        type="button"
                        onClick={() => handleSendReply(true)}
                        className="px-3.5 py-1.5 rounded-lg bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1 cursor-pointer active:scale-95 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                      >
                        <span className="material-symbols-outlined text-sm">check_circle</span>
                        <span>Enviar y resolver</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </aside>
      )}
    </div>
  );
};
