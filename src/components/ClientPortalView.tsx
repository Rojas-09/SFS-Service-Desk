import React, { useState } from 'react';
import { Ticket, User } from '../types';
import { SfsLogo } from './SfsLogo';
import { getStatusBadgeStyle, formatSlaBadge } from './TableView';
import { useTickets } from '../context/TicketsContext';
import { ThemeSelector } from './ThemeSelector';

interface ClientPortalViewProps {
  currentUser: User;
  tickets: Ticket[];
  subPath?: 'inicio' | 'nuevo' | 'tickets' | 'detalle';
  ticketIdParam?: string;
  onNavigate: (path: string) => void;
  onOpenNewTicket: () => void;
  onLogout: () => void;
  onNavigateToChangePassword: () => void;
}

export const ClientPortalView: React.FC<ClientPortalViewProps> = ({
  currentUser,
  tickets,
  subPath = 'inicio',
  ticketIdParam,
  onNavigate,
  onOpenNewTicket,
  onLogout,
  onNavigateToChangePassword
}) => {
  const { sendMessage, kpis } = useTickets();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [ticketSearch, setTicketSearch] = useState('');
  const [replyContent, setReplyContent] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');

  const clientCompany = currentUser.company || 'Trilladora La Manuela';

  // Requirement 5: un cliente solo obtiene tickets de SU empresa y nunca ve mensajes con interno = true
  const myCompanyTickets = tickets
    .filter(t => t.company === clientCompany || t.requesterEmail === currentUser.email)
    .map(t => ({
      ...t,
      // Sanitizar: eliminar notas internas
      messages: t.messages.filter(m => !m.isInternal)
    }));

  // Ticket para vista detalle
  const activeDetailTicket = ticketIdParam
    ? myCompanyTickets.find(t => t.id === ticketIdParam) || null
    : null;

  // Filtrado de lista de tickets
  const filteredTickets = myCompanyTickets.filter(t => {
    if (statusFilter === 'activos' && (t.status === 'Resuelto' || t.status === 'Cerrado')) return false;
    if (statusFilter === 'resueltos' && t.status !== 'Resuelto' && t.status !== 'Cerrado') return false;

    if (ticketSearch) {
      const q = ticketSearch.toLowerCase();
      const match =
        t.code.toLowerCase().includes(q) ||
        t.title.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  const handleSendClientReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim() || !activeDetailTicket) return;
    sendMessage(activeDetailTicket.id, replyContent.trim(), false);
    setReplyContent('');
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#F5F7FB] dark:bg-[#081B3A] font-sans antialiased text-slate-800 dark:text-[#E8EEF9] select-none transition-colors duration-200">
      {/* Topbar del Portal del Cliente */}
      <header className="h-auto min-h-16 bg-white dark:bg-[#0E2A52] border-b border-slate-200 dark:border-[#1E3F73] px-3 sm:px-6 py-2 sm:py-0 flex flex-wrap items-center justify-between gap-2 flex-shrink-0 z-30 shadow-2xs pt-safe transition-colors duration-200">
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <div className="bg-white dark:bg-[#081B3A] py-1 px-2.5 rounded-xl border border-transparent dark:border-[#1E3F73] flex-shrink-0 transition-colors">
            <SfsLogo className="w-full max-w-[130px] sm:max-w-[170px] h-auto object-contain" />
          </div>
          <span className="hidden sm:inline-block h-5 w-px bg-slate-200 dark:bg-[#1E3F73] flex-shrink-0" />
          <div className="hidden sm:block min-w-0">
            <span className="text-xs font-bold text-slate-900 dark:text-[#E8EEF9] block">Portal corporativo</span>
            <span className="text-[11px] text-slate-500 dark:text-[#94A9CC] font-medium block truncate">{clientCompany}</span>
          </div>
        </div>

        {/* Navegación del Portal: en móvil pasa a una fila propia con scroll */}
        <div className="order-3 sm:order-none w-full sm:w-auto flex items-center gap-1.5 sm:gap-2 overflow-x-auto custom-scrollbar -mx-1 px-1 sm:mx-0 sm:px-0">
          <button
            onClick={() => onNavigate('/portal')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap flex-shrink-0 ${
              subPath === 'inicio'
                ? 'bg-blue-50 text-blue-700 dark:bg-[#081B3A] dark:text-blue-400'
                : 'text-slate-600 dark:text-[#94A9CC] hover:bg-slate-100 dark:hover:bg-[#081B3A]'
            }`}
          >
            Inicio
          </button>
          <button
            onClick={() => onNavigate('/portal/tickets')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap flex-shrink-0 ${
              subPath === 'tickets' || subPath === 'detalle'
                ? 'bg-blue-50 text-blue-700 dark:bg-[#081B3A] dark:text-blue-400'
                : 'text-slate-600 dark:text-[#94A9CC] hover:bg-slate-100 dark:hover:bg-[#081B3A]'
            }`}
          >
            Mis solicitudes ({myCompanyTickets.length})
          </button>
          <button
            onClick={onOpenNewTicket}
            className="px-3 py-1.5 sm:px-3.5 rounded-xl bg-[#F37021] hover:bg-[#d95d13] active:bg-[#c95310] text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap flex-shrink-0"
          >
            <span className="material-symbols-outlined text-base leading-none">add_circle</span>
            <span>Nueva solicitud</span>
          </button>
        </div>

        {/* Zona Derecha: Selector de tema + Menú de Usuario */}
        <div className="flex items-center gap-2 ml-auto sm:ml-2 flex-shrink-0">
          <ThemeSelector />

          <div className="relative flex-shrink-0">
            <button
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              className="flex items-center gap-2 p-1 rounded-2xl hover:bg-slate-100 dark:hover:bg-[#081B3A] transition-colors cursor-pointer"
            >
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-8 h-8 rounded-full object-cover ring-2 ring-blue-600/30"
              />
              <span className="material-symbols-outlined text-slate-400 dark:text-[#94A9CC] text-sm">expand_more</span>
            </button>

            {profileDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 max-w-[calc(100vw-1.5rem)] bg-white dark:bg-[#0E2A52] rounded-2xl shadow-xl border border-slate-200 dark:border-[#1E3F73] py-1.5 z-50 text-xs animate-in fade-in slide-in-from-top-2">
                <div className="px-4 py-2.5 border-b border-slate-100 dark:border-[#1E3F73]">
                  <span className="font-bold text-slate-900 dark:text-[#E8EEF9] block">{currentUser.name}</span>
                  <span className="text-xs text-slate-500 dark:text-[#94A9CC] block truncate">{currentUser.email}</span>
                  <span className="mt-1 inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-700/60">
                    Cliente · {clientCompany}
                  </span>
                </div>

                <div className="py-1">
                  <button
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      onNavigateToChangePassword();
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-slate-50 dark:hover:bg-[#081B3A] flex items-center gap-2 cursor-pointer transition-colors text-slate-700 dark:text-[#E8EEF9] font-medium"
                  >
                    <span className="material-symbols-outlined text-base text-slate-400 dark:text-[#94A9CC]">lock_reset</span>
                    <span>Cambiar contraseña</span>
                  </button>

                  <button
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      onLogout();
                    }}
                    className="w-full text-left px-4 py-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-medium flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <span className="material-symbols-outlined text-base">logout</span>
                    <span>Cerrar sesión</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Contenido Principal según subruta */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-6 custom-scrollbar pb-safe">
        {/* SUBRUTA 1: DETALLE DE TICKET (/portal/tickets/[id]) */}
        {subPath === 'detalle' && activeDetailTicket ? (
          <div className="max-w-4xl mx-auto space-y-5">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <button
                onClick={() => onNavigate('/portal/tickets')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-[#0E2A52] border border-slate-200 dark:border-[#1E3F73] text-xs font-semibold text-slate-700 dark:text-[#E8EEF9] hover:bg-slate-50 dark:hover:bg-[#081B3A] transition-colors cursor-pointer shadow-2xs"
              >
                <span className="material-symbols-outlined text-base leading-none">arrow_back</span>
                <span>Volver a mis solicitudes</span>
              </button>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-blue-700 dark:text-blue-400">
                  {activeDetailTicket.code}
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStatusBadgeStyle(
                    activeDetailTicket.status
                  )}`}
                >
                  {activeDetailTicket.status}
                </span>
              </div>
            </div>

            {/* Cabecera del ticket */}
            <div className="bg-white dark:bg-[#0E2A52] rounded-3xl p-4 sm:p-6 border border-slate-200 dark:border-[#1E3F73] shadow-sm space-y-4 transition-colors">
              <div>
                <h1 className="text-base sm:text-xl font-bold text-slate-900 dark:text-[#E8EEF9] leading-tight">
                  {activeDetailTicket.title}
                </h1>
                <p className="text-xs text-slate-600 dark:text-[#94A9CC] mt-2 leading-relaxed whitespace-pre-wrap">
                  {activeDetailTicket.description}
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-100 dark:border-[#1E3F73] text-xs">
                <div>
                  <span className="text-slate-400 dark:text-[#94A9CC] block text-[11px]">Categoría</span>
                  <span className="font-semibold text-blue-700 dark:text-blue-400">{activeDetailTicket.category}</span>
                </div>
                <div>
                  <span className="text-slate-400 dark:text-[#94A9CC] block text-[11px]">Módulo</span>
                  <span className="font-medium text-slate-800 dark:text-[#E8EEF9]">{activeDetailTicket.module}</span>
                </div>
                <div>
                  <span className="text-slate-400 dark:text-[#94A9CC] block text-[11px]">Fecha de radicación</span>
                  <span className="font-medium text-slate-800 dark:text-[#E8EEF9]">{activeDetailTicket.createdAt}</span>
                </div>
                <div>
                  <span className="text-slate-400 dark:text-[#94A9CC] block text-[11px]">SLA de atención</span>
                  <span className="font-semibold text-emerald-700 dark:text-emerald-400">{activeDetailTicket.slaLimit}</span>
                </div>
              </div>
            </div>

            {/* Conversación pública (Sin notas internas) */}
            <div className="bg-white dark:bg-[#0E2A52] rounded-3xl p-4 sm:p-6 border border-slate-200 dark:border-[#1E3F73] shadow-sm space-y-4 transition-colors">
              <h2 className="text-sm font-bold text-slate-900 dark:text-[#E8EEF9] border-b border-slate-100 dark:border-[#1E3F73] pb-2">
                Respuestas y seguimiento
              </h2>

              <div className="space-y-3">
                {activeDetailTicket.messages.length === 0 ? (
                  <p className="text-xs text-slate-400 dark:text-[#94A9CC] py-4 text-center">
                    No hay mensajes adicionales. Nuestro equipo técnico responderá pronto.
                  </p>
                ) : (
                  activeDetailTicket.messages.map((m) => (
                    <div
                      key={m.id}
                      className={`p-4 rounded-2xl border text-xs leading-relaxed space-y-1 transition-colors ${
                        m.senderRole === 'soporte'
                          ? 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900/60 text-slate-900 dark:text-[#E8EEF9]'
                          : 'bg-slate-50 dark:bg-[#081B3A] border-slate-200 dark:border-[#1E3F73] text-slate-800 dark:text-[#E8EEF9]'
                      }`}
                    >
                      <div className="flex items-center justify-between font-bold">
                        <span className="flex items-center gap-1.5">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              m.senderRole === 'soporte' ? 'bg-blue-600 dark:bg-blue-400' : 'bg-emerald-500 dark:bg-emerald-400'
                            }`}
                          />
                          {m.senderName}
                        </span>
                        <span className="text-slate-400 dark:text-[#94A9CC] font-normal">{m.time}</span>
                      </div>
                      <p className="whitespace-pre-wrap pt-1">{m.content}</p>
                    </div>
                  ))
                )}
              </div>

              {/* Responder */}
              <form onSubmit={handleSendClientReply} className="pt-3 border-t border-slate-100 dark:border-[#1E3F73] space-y-2.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-[#E8EEF9]">
                  Agregar comentario o información adicional
                </label>
                <textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  className="w-full h-24 sm:h-20 p-3 bg-slate-50 dark:bg-[#081B3A] border border-slate-200 dark:border-[#1E3F73] rounded-2xl text-[16px] sm:text-xs text-slate-800 dark:text-[#E8EEF9] placeholder:text-slate-400 dark:placeholder:text-[#94A9CC]/60 focus:bg-white dark:focus:bg-[#081B3A] focus:ring-2 focus:ring-blue-600 focus:outline-none resize-none font-sans transition-colors"
                  placeholder="Escribe tu mensaje para el equipo de soporte SFS..."
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                  >
                    Enviar respuesta
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : subPath === 'tickets' ? (
          /* SUBRUTA 2: LISTA DE TICKETS (/portal/tickets) */
          <div className="max-w-5xl mx-auto space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h1 className="text-base sm:text-xl font-bold text-slate-900 dark:text-[#E8EEF9] tracking-tight">
                  Solicitudes de {clientCompany}
                </h1>
                <p className="text-xs text-slate-500 dark:text-[#94A9CC] mt-0.5">
                  Historial completo y estado de tus requerimientos radicados
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <input
                    type="text"
                    value={ticketSearch}
                    onChange={(e) => setTicketSearch(e.target.value)}
                    placeholder="Buscar solicitud..."
                    className="pl-8 pr-3 py-1.5 text-[16px] sm:text-xs bg-white dark:bg-[#081B3A] border border-slate-200 dark:border-[#1E3F73] rounded-xl text-slate-800 dark:text-[#E8EEF9] placeholder:text-slate-400 dark:placeholder:text-[#94A9CC]/60 focus:ring-2 focus:ring-blue-600 focus:outline-none w-full sm:w-56 font-sans transition-colors"
                  />
                  <span className="material-symbols-outlined text-slate-400 dark:text-[#94A9CC] text-base absolute left-2 top-1.5">
                    search
                  </span>
                </div>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="py-1.5 px-3 bg-white dark:bg-[#081B3A] border border-slate-200 dark:border-[#1E3F73] rounded-xl text-xs text-slate-800 dark:text-[#E8EEF9] focus:ring-2 focus:ring-blue-600 focus:outline-none cursor-pointer transition-colors"
                >
                  <option value="todos">Todos los estados</option>
                  <option value="activos">Solo activos</option>
                  <option value="resueltos">Resueltos / Cerrados</option>
                </select>
              </div>
            </div>

            {/* Listado */}
            <div className="space-y-3">
              {filteredTickets.length === 0 ? (
                <div className="p-12 text-center bg-white dark:bg-[#0E2A52] rounded-3xl border border-slate-200 dark:border-[#1E3F73] text-slate-400 dark:text-[#94A9CC] transition-colors">
                  <span className="material-symbols-outlined text-4xl text-slate-300 dark:text-[#94A9CC]/50">inbox</span>
                  <p className="text-xs font-semibold text-slate-600 dark:text-[#E8EEF9] mt-2">
                    No se encontraron solicitudes con los filtros actuales
                  </p>
                </div>
              ) : (
                filteredTickets.map((t) => {
                  const sla = formatSlaBadge(t);
                  return (
                    <div
                      key={t.id}
                      onClick={() => onNavigate(`/portal/tickets/${t.id}`)}
                      className="p-4 bg-white dark:bg-[#0E2A52] rounded-2xl border border-slate-200 dark:border-[#1E3F73] hover:border-blue-400 dark:hover:border-blue-400 hover:shadow-xs transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-bold text-blue-700 dark:text-blue-400">{t.code}</span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${getStatusBadgeStyle(
                              t.status
                            )}`}
                          >
                            {t.status}
                          </span>
                          <span className="text-slate-400 dark:text-[#94A9CC]">·</span>
                          <span className="text-slate-500 dark:text-[#94A9CC]">{t.category}</span>
                        </div>
                        <h3 className="font-semibold text-slate-900 dark:text-[#E8EEF9] leading-snug">{t.title}</h3>
                        <span className="text-[11px] text-slate-400 dark:text-[#94A9CC] block">
                          Radicado el {t.createdAt}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border ${sla.bgClass} ${sla.colorClass} ${sla.borderClass}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${sla.dotClass}`} />
                          <span>{sla.text}</span>
                        </span>
                        <span className="material-symbols-outlined text-slate-400 dark:text-[#94A9CC] text-base">
                          chevron_right
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ) : (
          /* SUBRUTA INICIO (/portal) */
          <div className="max-w-6xl mx-auto w-full space-y-6">
            {/* Banner de Bienvenida del Cliente */}
            <div className="bg-gradient-to-r from-[#0B2A5B] to-[#1565C0] dark:from-[#081B3A] dark:to-[#0E2A52] border border-transparent dark:border-[#1E3F73] rounded-3xl p-5 sm:p-7 text-white shadow-xl shadow-blue-950/15 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 sm:gap-5 transition-colors">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#F37021] text-white shadow-2xs">
                    Portal corporativo
                  </span>
                  <span className="text-xs text-blue-200 dark:text-blue-300">Atención bajo SLA</span>
                </div>
                <h1 className="text-xl sm:text-3xl font-bold tracking-tight">
                  Bienvenido, {currentUser.name}
                </h1>
                <p className="text-xs text-blue-100 dark:text-[#E8EEF9]/80 max-w-xl leading-relaxed">
                  Canal oficial de atención para incidentes, requerimientos y soporte técnico especializado de Software Factory and Services para {clientCompany}.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={onOpenNewTicket}
                  className="px-4 py-2.5 rounded-xl bg-[#F37021] hover:bg-[#d95d13] text-white text-xs font-bold shadow-md shadow-orange-950/20 transition-all flex items-center gap-2 active:scale-95 cursor-pointer focus:ring-2 focus:ring-blue-400 focus:outline-none"
                >
                  <span className="material-symbols-outlined text-lg leading-none">add_circle</span>
                  <span>Radicar solicitud</span>
                </button>
              </div>
            </div>

            {/* 3 Métricas del Cliente */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white dark:bg-[#0E2A52] p-4.5 rounded-2xl border border-slate-200 dark:border-[#1E3F73] shadow-2xs flex items-center justify-between hover:border-slate-300 dark:hover:border-[#2a5596] transition-colors">
                <div>
                  <span className="text-xs font-bold text-slate-500 dark:text-[#94A9CC] uppercase tracking-wider block">
                    Solicitudes activas
                  </span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-2xl font-bold text-slate-900 dark:text-[#E8EEF9]">
                      {myCompanyTickets.filter(t => t.status !== 'Resuelto' && t.status !== 'Cerrado').length}
                    </span>
                    <span className="text-xs text-blue-600 dark:text-blue-400 font-semibold">En seguimiento</span>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-xl leading-none">pending_actions</span>
                </div>
              </div>

              <div className="bg-white dark:bg-[#0E2A52] p-4.5 rounded-2xl border border-slate-200 dark:border-[#1E3F73] shadow-2xs flex items-center justify-between hover:border-slate-300 dark:hover:border-[#2a5596] transition-colors">
                <div>
                  <span className="text-xs font-bold text-slate-500 dark:text-[#94A9CC] uppercase tracking-wider block">
                    Tiempo promedio de respuesta
                  </span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-2xl font-bold text-slate-900 dark:text-[#E8EEF9]">{kpis.firstResponseTime}</span>
                    <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">Calculado</span>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-xl leading-none">speed</span>
                </div>
              </div>

              <div className="bg-white dark:bg-[#0E2A52] p-4.5 rounded-2xl border border-slate-200 dark:border-[#1E3F73] shadow-2xs flex items-center justify-between hover:border-slate-300 dark:hover:border-[#2a5596] transition-colors">
                <div>
                  <span className="text-xs font-bold text-slate-500 dark:text-[#94A9CC] uppercase tracking-wider block">
                    Cumplimiento SLA mensual
                  </span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                      {kpis.slaCompliancePercent.toFixed(1)}%
                    </span>
                    <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">Calculado</span>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-xl leading-none">verified</span>
                </div>
              </div>
            </div>

            {/* Listado de Casos Recientes */}
            <div className="bg-white dark:bg-[#0E2A52] rounded-3xl border border-slate-200 dark:border-[#1E3F73] shadow-2xs overflow-hidden transition-colors">
              <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-[#1E3F73] flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-[#E8EEF9] tracking-tight">
                    Solicitudes recientes
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-[#94A9CC]">
                    Últimos tickets reportados para {clientCompany}
                  </p>
                </div>
                <button
                  onClick={() => onNavigate('/portal/tickets')}
                  className="text-xs font-semibold text-blue-700 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 hover:underline cursor-pointer"
                >
                  Ver todas ({myCompanyTickets.length})
                </button>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-[#1E3F73]">
                {myCompanyTickets.slice(0, 5).map((ticket) => (
                  <div
                    key={ticket.id}
                    onClick={() => onNavigate(`/portal/tickets/${ticket.id}`)}
                    className="p-4 hover:bg-slate-50/80 dark:hover:bg-[#081B3A]/60 transition-colors flex items-center justify-between gap-4 cursor-pointer text-xs"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <span className="font-mono text-xs font-bold text-blue-700 dark:text-blue-400 flex-shrink-0">
                        {ticket.code}
                      </span>
                      <div className="min-w-0">
                        <span className="font-semibold text-slate-900 dark:text-[#E8EEF9] block truncate">
                          {ticket.title}
                        </span>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-[#94A9CC] mt-0.5">
                          <span>{ticket.module}</span>
                          <span>·</span>
                          <span>{ticket.createdHoursAgo}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStatusBadgeStyle(
                          ticket.status
                        )}`}
                      >
                        {ticket.status}
                      </span>
                      <span className="material-symbols-outlined text-slate-400 dark:text-[#94A9CC] text-sm">
                        arrow_forward
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
