import React, { useEffect } from 'react';
import { SfsLogo } from './SfsLogo';
import { User, UserRole } from '../types';

interface SidebarProps {
  currentUser: User;
  currentPath: string;
  onNavigate: (path: string) => void;
  onOpenNewTicket: () => void;
  isOpen: boolean;
  onClose: () => void;
  counts: {
    activos: number;
    mios: number;
    sinAsignar: number;
    todos: number;
    announcements: number;
    companies: number;
  };
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentUser,
  currentPath,
  onNavigate,
  onOpenNewTicket,
  isOpen,
  onClose,
  counts
}) => {
  const role: UserRole = currentUser.role;

  // Bloquea el scroll del fondo mientras el drawer está abierto en móvil
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  // Cierra con la tecla Escape
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  // Envuelve cada navegación para cerrar el drawer al navegar en móvil
  const navigate = (path: string) => {
    onNavigate(path);
    onClose();
  };

  // Permisos de secciones operativas según rol (Requirement 7)
  // Agente: Bandeja, Mis tickets, Sin asignar y Todos
  // Supervisor y admin: además Métricas, Anuncios, Empresas, Usuarios y Configuración
  const canSeeMetrics = role === 'supervisor' || role === 'admin';
  const canSeeAnnouncements = role === 'supervisor' || role === 'admin';
  const canSeeCompanies = role === 'supervisor' || role === 'admin';
  const canSeeUsers = role === 'supervisor' || role === 'admin';
  const canSeeSettings = role === 'supervisor' || role === 'admin';

  const hasAnyOperations = canSeeMetrics || canSeeAnnouncements || canSeeCompanies || canSeeUsers || canSeeSettings;

  return (
    <>
      {/* Backdrop: solo móvil, oscurece el contenido detrás del drawer */}
      <div
        onClick={onClose}
        aria-hidden="true"
        className={`lg:hidden fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-[2px] transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      />

      <aside
        aria-label="Navegación principal"
        aria-hidden={false}
        className={`w-[17rem] max-w-[85vw] h-full bg-[#0B2A5B] dark:bg-[#081B3A] flex flex-col justify-between py-4 pl-3.5 pr-3.5 text-white z-50 flex-shrink-0 shadow-xl border-r border-[#153a75] dark:border-[#1E3F73] overflow-x-hidden transition-colors duration-200
          /* Móvil: drawer deslizante fuera de pantalla */
          fixed inset-y-0 left-0 transition-transform duration-300 ease-out pb-safe
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          /* Escritorio: columna fija siempre visible */
          lg:static lg:translate-x-0 lg:w-64 lg:max-w-none lg:shadow-none lg:pb-4`}
      >
        {/* Top Sidebar: Placa con Logo + Nuevo Ticket + Menú de Bandejas */}
        <div className="flex flex-col gap-3.5 overflow-y-auto overflow-x-hidden custom-scrollbar pr-0.5">
          {/* Placa blanca con padding para el logo completo (Requirement 7) */}
          <div className="px-1 pt-0.5 pb-2 border-b border-white/10 relative">
            {/* Botón de cerrar: solo dentro del drawer móvil */}
            <button
              onClick={onClose}
              aria-label="Cerrar menú"
              className="lg:hidden absolute top-1 right-1 p-2 -mr-1 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 active:bg-white/20 transition-colors cursor-pointer focus:ring-2 focus:ring-blue-400 focus:outline-none"
            >
              <span className="material-symbols-outlined text-xl leading-none block">close</span>
            </button>
            <div className="bg-white rounded-xl p-2.5 flex items-center justify-center shadow-sm mb-2.5 transition-transform hover:scale-[1.01]">
              <SfsLogo className="w-full h-auto object-contain" />
            </div>
            <div className="flex items-center justify-between gap-2 px-1">
              <div className="leading-tight min-w-0">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-100 block">
                  SFS Service Desk
                </span>
                <span className="text-xs text-blue-200 font-medium tracking-tight block">
                  Mesa de ayuda operativa
                </span>
              </div>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-white/15 text-blue-100 flex-shrink-0">
                {role}
              </span>
            </div>
          </div>

          {/* Botón Nuevo ticket (naranja institucional) */}
          <button
            onClick={() => {
              onOpenNewTicket();
              onClose();
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#F37021] to-[#e0651d] hover:from-[#e0651d] hover:to-[#c95310] text-white font-semibold text-xs tracking-wide shadow-md shadow-orange-950/20 transition-all active:scale-[0.98] cursor-pointer focus:ring-2 focus:ring-blue-400 focus:outline-none"
          >
            <span className="material-symbols-outlined text-lg leading-none">add_circle</span>
            <span>Nuevo ticket</span>
          </button>

          {/* Navegación: Bandejas de gestión (Rutas reales /consola/*) */}
          <div className="space-y-1">
            <div className="px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-blue-200">
              Bandejas de gestión
            </div>
            <nav className="space-y-0.5">
              {/* 1. Bandeja de tickets: activos del equipo */}
              <a
                href="/consola/bandeja"
                onClick={(e) => {
                  e.preventDefault();
                  navigate('/consola/bandeja');
                }}
                className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-xs transition-all cursor-pointer focus:ring-2 focus:ring-blue-400 focus:outline-none no-underline ${
                  currentPath === '/consola/bandeja'
                    ? 'bg-blue-600 text-white font-semibold shadow-xs'
                    : 'text-slate-200 hover:bg-white/10 hover:text-white font-medium active:bg-white/15'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="material-symbols-outlined text-base flex-shrink-0">inbox</span>
                  <span className="truncate">Bandeja de tickets</span>
                </div>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-[#F37021] text-white shadow-2xs flex-shrink-0">
                  {counts.activos}
                </span>
              </a>

              {/* 2. Mis tickets: activos asignados al usuario en sesión */}
              <a
                href="/consola/mis-tickets"
                onClick={(e) => {
                  e.preventDefault();
                  navigate('/consola/mis-tickets');
                }}
                className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-xs transition-all cursor-pointer focus:ring-2 focus:ring-blue-400 focus:outline-none no-underline ${
                  currentPath === '/consola/mis-tickets'
                    ? 'bg-blue-600 text-white font-semibold shadow-xs'
                    : 'text-slate-200 hover:bg-white/10 hover:text-white font-medium active:bg-white/15'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="material-symbols-outlined text-base text-slate-300 flex-shrink-0">assignment_ind</span>
                  <span className="truncate">Mis tickets</span>
                </div>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-white/15 text-slate-100 flex-shrink-0">
                  {counts.mios}
                </span>
              </a>

              {/* 3. Sin asignar: activos sin agente */}
              <a
                href="/consola/sin-asignar"
                onClick={(e) => {
                  e.preventDefault();
                  navigate('/consola/sin-asignar');
                }}
                className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-xs transition-all cursor-pointer focus:ring-2 focus:ring-blue-400 focus:outline-none no-underline ${
                  currentPath === '/consola/sin-asignar'
                    ? 'bg-blue-600 text-white font-semibold shadow-xs'
                    : 'text-slate-200 hover:bg-white/10 hover:text-white font-medium active:bg-white/15'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="material-symbols-outlined text-base text-slate-300 flex-shrink-0">person_off</span>
                  <span className="truncate">Sin asignar</span>
                </div>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-500/30 text-rose-200 border border-rose-400/40 flex-shrink-0">
                  {counts.sinAsignar}
                </span>
              </a>

              {/* 4. Todos los tickets: todos, incluidos Resuelto y Cerrado */}
              <a
                href="/consola/todos"
                onClick={(e) => {
                  e.preventDefault();
                  navigate('/consola/todos');
                }}
                className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-xs transition-all cursor-pointer focus:ring-2 focus:ring-blue-400 focus:outline-none no-underline ${
                  currentPath === '/consola/todos'
                    ? 'bg-blue-600 text-white font-semibold shadow-xs'
                    : 'text-slate-200 hover:bg-white/10 hover:text-white font-medium active:bg-white/15'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="material-symbols-outlined text-base text-slate-300 flex-shrink-0">dvr</span>
                  <span className="truncate">Todos los tickets</span>
                </div>
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-white/10 text-slate-300 flex-shrink-0">
                  {counts.todos}
                </span>
              </a>
            </nav>
          </div>

        {/* Navegación: Operaciones y control (Requirement 6: Solo los ítems permitidos para el rol) */}
        {hasAnyOperations && (
          <div className="space-y-1 pt-1.5 border-t border-white/10">
            <div className="px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-blue-200">
              Operaciones y control
            </div>
            <nav className="space-y-0.5">
              {canSeeMetrics && (
                <a
                  href="/consola/metricas"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate('/consola/metricas');
                  }}
                  className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-xs transition-all cursor-pointer focus:ring-2 focus:ring-blue-400 focus:outline-none no-underline ${
                    currentPath === '/consola/metricas'
                      ? 'bg-blue-600 text-white font-semibold'
                      : 'text-slate-200 hover:bg-white/10 hover:text-white font-medium active:bg-white/15'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="material-symbols-outlined text-base text-slate-300 flex-shrink-0">analytics</span>
                    <span className="truncate">Métricas y SLA</span>
                  </div>
                </a>
              )}

              {canSeeAnnouncements && (
                <a
                  href="/consola/anuncios"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate('/consola/anuncios');
                  }}
                  className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-xs transition-all cursor-pointer focus:ring-2 focus:ring-blue-400 focus:outline-none no-underline ${
                    currentPath === '/consola/anuncios'
                      ? 'bg-blue-600 text-white font-semibold'
                      : 'text-slate-200 hover:bg-white/10 hover:text-white font-medium active:bg-white/15'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="material-symbols-outlined text-base text-slate-300 flex-shrink-0">campaign</span>
                    <span className="truncate">Anuncios</span>
                  </div>
                  <span className="text-xs font-semibold text-emerald-300 bg-emerald-500/20 border border-emerald-400/30 px-1.5 py-0.5 rounded-full flex-shrink-0">
                    {counts.announcements}
                  </span>
                </a>
              )}

              {canSeeCompanies && (
                <a
                  href="/consola/empresas"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate('/consola/empresas');
                  }}
                  className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-xs transition-all cursor-pointer focus:ring-2 focus:ring-blue-400 focus:outline-none no-underline ${
                    currentPath === '/consola/empresas'
                      ? 'bg-blue-600 text-white font-semibold'
                      : 'text-slate-200 hover:bg-white/10 hover:text-white font-medium active:bg-white/15'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="material-symbols-outlined text-base text-slate-300 flex-shrink-0">corporate_fare</span>
                    <span className="truncate">Empresas cliente</span>
                  </div>
                  <span className="text-xs font-semibold text-blue-200 bg-white/10 px-1.5 py-0.5 rounded-full flex-shrink-0">
                    {counts.companies}
                  </span>
                </a>
              )}

              {canSeeUsers && (
                <a
                  href="/consola/usuarios"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate('/consola/usuarios');
                  }}
                  className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-xs transition-all cursor-pointer focus:ring-2 focus:ring-blue-400 focus:outline-none no-underline ${
                    currentPath === '/consola/usuarios'
                      ? 'bg-blue-600 text-white font-semibold'
                      : 'text-slate-200 hover:bg-white/10 hover:text-white font-medium active:bg-white/15'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="material-symbols-outlined text-base text-slate-300 flex-shrink-0">group</span>
                    <span className="truncate">Usuarios y agentes</span>
                  </div>
                </a>
              )}

              {canSeeSettings && (
                <a
                  href="/consola/configuracion"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate('/consola/configuracion');
                  }}
                  className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-xs transition-all cursor-pointer focus:ring-2 focus:ring-blue-400 focus:outline-none no-underline ${
                    currentPath === '/consola/configuracion'
                      ? 'bg-blue-600 text-white font-semibold'
                      : 'text-slate-200 hover:bg-white/10 hover:text-white font-medium active:bg-white/15'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="material-symbols-outlined text-base text-slate-300 flex-shrink-0">settings</span>
                    <span className="truncate">Configuración</span>
                  </div>
                </a>
              )}
            </nav>
          </div>
        )}
      </div>

      {/* Footer limpio */}
      <div className="pt-2 border-t border-white/10 px-1 flex-shrink-0">
        <div className="text-[12px] text-blue-200/80 text-center font-medium">
          Software Factory and Services
        </div>
      </div>
      </aside>
    </>
  );
};
