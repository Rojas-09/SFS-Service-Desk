import React from 'react';
import { SfsLogo } from './SfsLogo';
import { User, UserRole } from '../types';

interface SidebarProps {
  currentUser: User;
  currentPath: string;
  onNavigate: (path: string) => void;
  onOpenNewTicket: () => void;
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
  counts
}) => {
  const role: UserRole = currentUser.role;

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
    <aside className="w-64 min-w-[16rem] h-full bg-[#0B2A5B] flex flex-col justify-between py-4 px-3.5 text-white z-20 flex-shrink-0 shadow-xl border-r border-[#153a75] select-none overflow-x-hidden">
      {/* Top Sidebar: Placa con Logo + Nuevo Ticket + Menú de Bandejas */}
      <div className="flex flex-col gap-3.5 overflow-y-auto overflow-x-hidden custom-scrollbar pr-0.5">
        {/* Placa blanca con padding para el logo completo (Requirement 7) */}
        <div className="px-1 pt-0.5 pb-2 border-b border-white/10">
          <div className="bg-white rounded-xl p-2.5 flex items-center justify-center shadow-sm mb-2.5 transition-transform hover:scale-[1.01]">
            <SfsLogo className="w-full h-auto object-contain" />
          </div>
          <div className="flex items-center justify-between px-1">
            <div className="leading-tight">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-100 block">
                SFS Service Desk
              </span>
              <span className="text-xs text-blue-200 font-medium tracking-tight">
                Mesa de ayuda operativa
              </span>
            </div>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-white/15 text-blue-100">
              {role}
            </span>
          </div>
        </div>

        {/* Botón Nuevo ticket (naranja institucional) */}
        <button
          onClick={onOpenNewTicket}
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
                onNavigate('/consola/bandeja');
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all cursor-pointer focus:ring-2 focus:ring-blue-400 focus:outline-none no-underline ${
                currentPath === '/consola/bandeja'
                  ? 'bg-blue-600 text-white font-semibold shadow-xs'
                  : 'text-slate-200 hover:bg-white/10 hover:text-white font-medium'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-base">inbox</span>
                <span>Bandeja de tickets</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-[#F37021] text-white shadow-2xs">
                {counts.activos}
              </span>
            </a>

            {/* 2. Mis tickets: activos asignados al usuario en sesión */}
            <a
              href="/consola/mis-tickets"
              onClick={(e) => {
                e.preventDefault();
                onNavigate('/consola/mis-tickets');
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all cursor-pointer focus:ring-2 focus:ring-blue-400 focus:outline-none no-underline ${
                currentPath === '/consola/mis-tickets'
                  ? 'bg-blue-600 text-white font-semibold shadow-xs'
                  : 'text-slate-200 hover:bg-white/10 hover:text-white font-medium'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-base text-slate-300">assignment_ind</span>
                <span>Mis tickets</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-white/15 text-slate-100">
                {counts.mios}
              </span>
            </a>

            {/* 3. Sin asignar: activos sin agente */}
            <a
              href="/consola/sin-asignar"
              onClick={(e) => {
                e.preventDefault();
                onNavigate('/consola/sin-asignar');
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all cursor-pointer focus:ring-2 focus:ring-blue-400 focus:outline-none no-underline ${
                currentPath === '/consola/sin-asignar'
                  ? 'bg-blue-600 text-white font-semibold shadow-xs'
                  : 'text-slate-200 hover:bg-white/10 hover:text-white font-medium'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-base text-slate-300">person_off</span>
                <span>Sin asignar</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-500/30 text-rose-200 border border-rose-400/40">
                {counts.sinAsignar}
              </span>
            </a>

            {/* 4. Todos los tickets: todos, incluidos Resuelto y Cerrado */}
            <a
              href="/consola/todos"
              onClick={(e) => {
                e.preventDefault();
                onNavigate('/consola/todos');
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all cursor-pointer focus:ring-2 focus:ring-blue-400 focus:outline-none no-underline ${
                currentPath === '/consola/todos'
                  ? 'bg-blue-600 text-white font-semibold shadow-xs'
                  : 'text-slate-200 hover:bg-white/10 hover:text-white font-medium'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-base text-slate-300">dvr</span>
                <span>Todos los tickets</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-white/10 text-slate-300">
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
                    onNavigate('/consola/metricas');
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all cursor-pointer focus:ring-2 focus:ring-blue-400 focus:outline-none no-underline ${
                    currentPath === '/consola/metricas'
                      ? 'bg-blue-600 text-white font-semibold'
                      : 'text-slate-200 hover:bg-white/10 hover:text-white font-medium'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-base text-slate-300">analytics</span>
                    <span>Métricas y SLA</span>
                  </div>
                </a>
              )}

              {canSeeAnnouncements && (
                <a
                  href="/consola/anuncios"
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigate('/consola/anuncios');
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all cursor-pointer focus:ring-2 focus:ring-blue-400 focus:outline-none no-underline ${
                    currentPath === '/consola/anuncios'
                      ? 'bg-blue-600 text-white font-semibold'
                      : 'text-slate-200 hover:bg-white/10 hover:text-white font-medium'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-base text-slate-300">campaign</span>
                    <span>Anuncios</span>
                  </div>
                  <span className="text-xs font-semibold text-emerald-300 bg-emerald-500/20 border border-emerald-400/30 px-1.5 py-0.5 rounded-full">
                    {counts.announcements}
                  </span>
                </a>
              )}

              {canSeeCompanies && (
                <a
                  href="/consola/empresas"
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigate('/consola/empresas');
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all cursor-pointer focus:ring-2 focus:ring-blue-400 focus:outline-none no-underline ${
                    currentPath === '/consola/empresas'
                      ? 'bg-blue-600 text-white font-semibold'
                      : 'text-slate-200 hover:bg-white/10 hover:text-white font-medium'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-base text-slate-300">corporate_fare</span>
                    <span>Empresas cliente</span>
                  </div>
                  <span className="text-xs font-semibold text-blue-200 bg-white/10 px-1.5 py-0.5 rounded-full">
                    {counts.companies}
                  </span>
                </a>
              )}

              {canSeeUsers && (
                <a
                  href="/consola/usuarios"
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigate('/consola/usuarios');
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all cursor-pointer focus:ring-2 focus:ring-blue-400 focus:outline-none no-underline ${
                    currentPath === '/consola/usuarios'
                      ? 'bg-blue-600 text-white font-semibold'
                      : 'text-slate-200 hover:bg-white/10 hover:text-white font-medium'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-base text-slate-300">group</span>
                    <span>Usuarios y agentes</span>
                  </div>
                </a>
              )}

              {canSeeSettings && (
                <a
                  href="/consola/configuracion"
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigate('/consola/configuracion');
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all cursor-pointer focus:ring-2 focus:ring-blue-400 focus:outline-none no-underline ${
                    currentPath === '/consola/configuracion'
                      ? 'bg-blue-600 text-white font-semibold'
                      : 'text-slate-200 hover:bg-white/10 hover:text-white font-medium'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-base text-slate-300">settings</span>
                    <span>Configuración</span>
                  </div>
                </a>
              )}
            </nav>
          </div>
        )}
      </div>

      {/* Footer limpio */}
      <div className="pt-2 border-t border-white/10 px-1">
        <div className="text-[12px] text-blue-200/80 text-center font-medium">
          Software Factory and Services
        </div>
      </div>
    </aside>
  );
};
