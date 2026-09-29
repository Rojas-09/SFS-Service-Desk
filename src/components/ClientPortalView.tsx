import React, { useState } from 'react';
import { Ticket, User } from '../types';
import { SfsLogo } from './SfsLogo';
import { getStatusBadgeStyle, formatSlaBadge } from './TableView';
import { useTickets } from '../context/TicketsContext';

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
  const { sendMessage } = useTickets();
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
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#F5F7FB] font-sans antialiased text-slate-800 select-none">
      {/* Topbar del Portal del Cliente */}
      <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between flex-shrink-0 z-30 shadow-2xs">
        <div className="flex items-center gap-4">
          <div className="bg-white py-1 px-2 rounded-xl">
            <SfsLogo className="w-full max-w-[170px] h-auto object-contain" />
          </div>
          <span className="hidden sm:inline-block h-5 w-px bg-slate-200" />
          <div className="hidden sm:block">
            <span className="text-xs font-bold text-slate-900 block">Portal corporativo</span>
            <span className="text-[11px] text-slate-500 font-medium block">{clientCompany}</span>
          </div>
        </div>

        {/* Navegación del Portal */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('/portal')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
              subPath === 'inicio' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Inicio
          </button>
          <button
            onClick={() => onNavigate('/portal/tickets')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
              subPath === 'tickets' || subPath === 'detalle'
                ? 'bg-blue-50 text-blue-700'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Mis solicitudes ({myCompanyTickets.length})
          </button>
          <button
            onClick={onOpenNewTicket}
            className="px-3.5 py-1.5 rounded-xl bg-[#F37021] hover:bg-[#d95d13] text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer ml-2"
          >
            <span className="material-symbols-outlined text-base leading-none">add_circle</span>
            <span>Nueva solicitud</span>
          </button>

          {/* Menú de Usuario (Requirement 12) */}
          <div className="relative ml-2">
            <button
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              className="flex items-center gap-2 p-1 rounded-2xl hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-8 h-8 rounded-full object-cover ring-2 ring-blue-600/30"
              />
              <span className="material-symbols-outlined text-slate-400 text-sm">expand_more</span>
            </button>

            {profileDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 py-1.5 z-50 text-xs animate-in fade-in slide-in-from-top-2">
                <div className="px-4 py-2.5 border-b border-slate-100">
                  <span className="font-bold text-slate-900 block">{currentUser.name}</span>
                  <span className="text-xs text-slate-500 block truncate">{currentUser.email}</span>
                  <span className="mt-1 inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200/60">
                    Cliente · {clientCompany}
                  </span>
                </div>

                <div className="py-1">
                  <button
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      onNavigateToChangePassword();
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2 cursor-pointer transition-colors text-slate-700 font-medium"
                  >
                    <span className="material-symbols-outlined text-base text-slate-400">lock_reset</span>
                    <span>Cambiar contraseña</span>
                  </button>

                  <button
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      onLogout();
                    }}
                    className="w-full text-left px-4 py-2 text-rose-600 hover:bg-rose-50 font-medium flex items-center gap-2 cursor-pointer transition-colors"
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
      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
        {/* SUBRUTA 1: DETALLE DE TICKET (/portal/tickets/[id]) */}
        {subPath === 'detalle' && activeDetailTicket ? (
          <div className="max-w-4xl mx-auto space-y-5">
            <div className="flex items-center justify-between">
              <button
                onClick={() => onNavigate('/portal/tickets')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer shadow-2xs"
              >
                <span className="material-symbols-outlined text-base leading-none">arrow_back</span>
                <span>Volver a mis solicitudes</span>
              </button>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-blue-700">
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
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div>
                <h1 className="text-xl font-bold text-slate-900 leading-tight">
                  {activeDetailTicket.title}
                </h1>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed whitespace-pre-wrap">
                  {activeDetailTicket.description}
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-100 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">Categoría</span>
                  <span className="font-semibold text-blue-700">{activeDetailTicket.category}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Módulo</span>
                  <span className="font-medium text-slate-800">{activeDetailTicket.module}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Fecha de radicación</span>
                  <span className="font-medium text-slate-800">{activeDetailTicket.createdAt}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">SLA de atención</span>
                  <span className="font-semibold text-emerald-700">{activeDetailTicket.slaLimit}</span>
                </div>
              </div>
            </div>

            {/* Conversación pública (Sin notas internas) */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
              <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
                Respuestas y seguimiento
              </h2>

              <div className="space-y-3">
                {activeDetailTicket.messages.length === 0 ? (
                  <p className="text-xs text-slate-400 py-4 text-center">
                    No hay mensajes adicionales. Nuestro equipo técnico responderá pronto.
                  </p>
                ) : (
                  activeDetailTicket.messages.map((m) => (
                    <div
                      key={m.id}
                      className={`p-4 rounded-2xl border text-xs leading-relaxed space-y-1 ${
                        m.senderRole === 'soporte'
                          ? 'bg-blue-50/80 border-blue-200 text-slate-900'
                          : 'bg-slate-50 border-slate-200 text-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between font-bold">
                        <span className="flex items-center gap-1.5">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              m.senderRole === 'soporte' ? 'bg-blue-600' : 'bg-emerald-500'
                            }`}
                          />
                          {m.senderName}
                        </span>
                        <span className="text-slate-400 font-normal">{m.time}</span>
                      </div>
                      <p className="whitespace-pre-wrap pt-1">{m.content}</p>
                    </div>
                  ))
                )}
              </div>

              {/* Responder */}
              <form onSubmit={handleSendClientReply} className="pt-3 border-t border-slate-100 space-y-2.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Agregar comentario o información adicional
                </label>
                <textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  className="w-full h-20 p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none resize-none font-sans"
                  placeholder="Escribe tu mensaje para el equipo de soporte SFS..."
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                  Solicitudes de {clientCompany}
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
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
                    className="pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-600 focus:outline-none w-56 font-sans"
                  />
                  <span className="material-symbols-outlined text-slate-400 text-base absolute left-2 top-1.5">
                    search
                  </span>
                </div>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="py-1.5 px-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-blue-600 focus:outline-none cursor-pointer"
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
                <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 text-slate-400">
                  <span className="material-symbols-outlined text-4xl text-slate-300">inbox</span>
                  <p className="text-xs font-semibold text-slate-600 mt-2">
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
                      className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-blue-400 hover:shadow-xs transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-blue-700">{t.code}</span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${getStatusBadgeStyle(
                              t.status
                            )}`}
                          >
                            {t.status}
                          </span>
                          <span className="text-slate-400">·</span>
                          <span className="text-slate-500">{t.category}</span>
                        </div>
                        <h3 className="font-semibold text-slate-900 leading-snug">{t.title}</h3>
                        <span className="text-[11px] text-slate-400 block">
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
                        <span className="material-symbols-outlined text-slate-400 text-base">
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
            <div className="bg-gradient-to-r from-[#0B2A5B] to-[#1565C0] rounded-3xl p-7 text-white shadow-xl shadow-blue-950/15 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#F37021] text-white shadow-2xs">
                    Portal corporativo
                  </span>
                  <span className="text-xs text-blue-200">SLA Platinum 99.9%</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                  Bienvenido, {currentUser.name}
                </h1>
                <p className="text-xs text-blue-100 max-w-xl leading-relaxed">
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
              <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between hover:border-slate-300 transition-colors">
                <div>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                    Solicitudes activas
                  </span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-2xl font-bold text-slate-900">
                      {myCompanyTickets.filter(t => t.status !== 'Resuelto' && t.status !== 'Cerrado').length}
                    </span>
                    <span className="text-xs text-blue-600 font-semibold">En seguimiento</span>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-xl leading-none">pending_actions</span>
                </div>
              </div>

              <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between hover:border-slate-300 transition-colors">
                <div>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                    Tiempo promedio de respuesta
                  </span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-2xl font-bold text-slate-900">18 min</span>
                    <span className="text-xs text-emerald-600 font-semibold">Garantizado</span>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-xl leading-none">speed</span>
                </div>
              </div>

              <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between hover:border-slate-300 transition-colors">
                <div>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                    Cumplimiento SLA mensual
                  </span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-2xl font-bold text-emerald-600">99.4%</span>
                    <span className="text-xs text-emerald-600 font-semibold">Óptimo</span>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-xl leading-none">verified</span>
                </div>
              </div>
            </div>

            {/* Listado de Casos Recientes */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-900 tracking-tight">
                    Solicitudes recientes
                  </h2>
                  <p className="text-xs text-slate-500">
                    Últimos tickets reportados para {clientCompany}
                  </p>
                </div>
                <button
                  onClick={() => onNavigate('/portal/tickets')}
                  className="text-xs font-semibold text-blue-700 hover:text-blue-900 hover:underline cursor-pointer"
                >
                  Ver todas ({myCompanyTickets.length})
                </button>
              </div>

              <div className="divide-y divide-slate-100">
                {myCompanyTickets.slice(0, 5).map((ticket) => (
                  <div
                    key={ticket.id}
                    onClick={() => onNavigate(`/portal/tickets/${ticket.id}`)}
                    className="p-4 hover:bg-slate-50/80 transition-colors flex items-center justify-between gap-4 cursor-pointer text-xs"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <span className="font-mono text-xs font-bold text-blue-700 flex-shrink-0">
                        {ticket.code}
                      </span>
                      <div className="min-w-0">
                        <span className="font-semibold text-slate-900 block truncate">
                          {ticket.title}
                        </span>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
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
                      <span className="material-symbols-outlined text-slate-400 text-sm">
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
