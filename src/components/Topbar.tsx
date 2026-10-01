import React, { useState, useEffect, useRef } from 'react';
import { User, UserRole } from '../types';

interface TopbarProps {
  currentUser: User;
  onLogout: () => void;
  onSwitchUser?: (role: UserRole) => void;
  appMode?: 'agente' | 'cliente';
  onToggleAppMode?: (mode: 'agente' | 'cliente') => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onNavigateToChangePassword: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({
  currentUser,
  onLogout,
  onSwitchUser,
  appMode = 'agente',
  onToggleAppMode,
  searchQuery,
  onSearchChange,
  onNavigateToChangePassword
}) => {
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [schedulePopoverOpen, setSchedulePopoverOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  // Global Ctrl+K / Cmd+K handler for the global search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close profile dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(e.target as Node)) {
        setProfileDropdownOpen(false);
      }
    };
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  // Selector DEV (Requirement 2 - K9): Solo disponible con import.meta.env.DEV en true
  const showDevRoleSwitch = Boolean(import.meta.env.DEV);

  return (
    <header className="h-14 bg-white border-b border-slate-200/90 px-4 sm:px-6 flex items-center justify-between flex-shrink-0 z-30 shadow-2xs select-none">
      {/* Zona Izquierda: Buscador Global (Ctrl+K) y opcional Role Switch solo con dev flag */}
      <div className="flex items-center gap-3 flex-1 min-w-0 pr-3">
        {/* Toggle Mode: solo visible con flag NEXT_PUBLIC_DEV_ROLE_SWITCH=true (Requirement 6) */}
        {showDevRoleSwitch && onToggleAppMode && (
          <div className="inline-flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200/80 flex-shrink-0">
            <button
              onClick={() => onToggleAppMode('agente')}
              className={`px-2.5 sm:px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap focus:ring-2 focus:ring-blue-600 focus:outline-none ${
                appMode === 'agente'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="material-symbols-outlined text-sm leading-none">support_agent</span>
              <span className="hidden sm:inline">Consola agente</span>
            </button>
            <button
              onClick={() => onToggleAppMode('cliente')}
              className={`px-2.5 sm:px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap focus:ring-2 focus:ring-blue-600 focus:outline-none ${
                appMode === 'cliente'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="material-symbols-outlined text-sm leading-none">domain</span>
              <span className="hidden sm:inline">Portal cliente</span>
            </button>
          </div>
        )}

        {/* Único Buscador Global con Ctrl+K */}
        <div className="relative flex-1 min-w-0 max-w-md">
          <span className="material-symbols-outlined absolute left-2.5 top-2 text-slate-400 text-base leading-none">
            search
          </span>
          <input
            ref={searchInputRef}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-8 pr-14 py-1.5 text-xs bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-xl text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all font-sans"
            placeholder="Buscar por #ID, empresa o asunto..."
            type="text"
          />
          <kbd className="hidden sm:inline-flex items-center gap-0.5 absolute right-2 top-1.5 px-1.5 py-0.5 rounded text-[11px] font-mono font-medium text-slate-400 bg-slate-200/60 border border-slate-300/40">
            Ctrl+K
          </kbd>
        </div>
      </div>

      {/* Zona Derecha: Horario Hábil Compacto + Notificaciones + Perfil */}
      <div className="flex items-center gap-3 flex-shrink-0 min-w-0">
        {/* Horario hábil: Indicador compacto flex sin posiciones absolutas (>= 1280px) */}
        <div className="hidden xl:flex items-center gap-1.5 text-xs text-slate-600 font-medium px-2.5 py-1 rounded-xl bg-slate-50 border border-slate-200/80">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
          <span>Horario hábil 8:00 a. m. – 6:00 p. m.</span>
        </div>

        {/* Popover Horario hábil para pantallas menores (< 1280px) */}
        <div className="xl:hidden relative">
          <button
            onClick={() => setSchedulePopoverOpen(!schedulePopoverOpen)}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 cursor-pointer transition-colors relative flex items-center justify-center focus:ring-2 focus:ring-blue-600 focus:outline-none"
            title="Ver horario hábil"
          >
            <span className="material-symbols-outlined text-xl">schedule</span>
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white" />
          </button>

          {schedulePopoverOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 p-3 z-50 text-xs animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="font-bold text-slate-800">Horario de operación</span>
              </div>
              <p className="text-slate-600 leading-snug">
                Horario hábil: <strong>8:00 a. m. – 6:00 p. m.</strong> (Lunes a Viernes). Atención continuada de soporte para clientes con SLA activo.
              </p>
            </div>
          )}
        </div>

        {/* Notificaciones */}
        <div className="relative">
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 cursor-pointer transition-colors relative flex items-center justify-center focus:ring-2 focus:ring-blue-600 focus:outline-none"
            title="Notificaciones"
          >
            <span className="material-symbols-outlined text-xl">notifications</span>
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#F37021] rounded-full ring-2 ring-white" />
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-200 p-3 z-50 text-xs animate-in fade-in slide-in-from-top-2 space-y-2">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="font-bold text-slate-900">Notificaciones</span>
                <span className="text-[11px] text-blue-600 font-semibold cursor-pointer hover:underline">
                  Marcar leídas
                </span>
              </div>
              <div className="space-y-2">
                <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="font-bold text-slate-800 block">Alerta SLA crítica</span>
                  <p className="text-slate-500 mt-0.5">El ticket #SFS-1025 tiene menos de 1 h para cumplimiento.</p>
                  <span className="text-[10px] text-slate-400 mt-1 block">hace 15 min</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Perfil del Usuario y Menú Desplegable (Requirement 12) */}
        <div className="relative" ref={profileDropdownRef}>
          <button
            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
            className="flex items-center gap-2.5 p-1 rounded-2xl hover:bg-slate-100 transition-colors cursor-pointer group focus:ring-2 focus:ring-blue-600 focus:outline-none"
            title="Menú de usuario"
          >
            <div className="relative flex-shrink-0">
              <img
                alt={currentUser.name}
                className="w-8 h-8 rounded-full object-cover ring-2 ring-blue-600/30 group-hover:ring-blue-600 transition-all"
                src={currentUser.avatar}
              />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
            </div>
            <div className="hidden md:block text-left leading-tight">
              <span className="text-xs font-bold text-slate-800 block group-hover:text-blue-700 transition-colors">
                {currentUser.name}
              </span>
              <span className="text-[11px] text-slate-500 font-medium block">
                {currentUser.title}
              </span>
            </div>
            <span className="material-symbols-outlined text-slate-400 text-sm">expand_more</span>
          </button>

          {/* Menú de Perfil (Requirement 12) */}
          {profileDropdownOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 py-1.5 z-50 text-xs animate-in fade-in slide-in-from-top-2">
              <div className="px-4 py-2.5 border-b border-slate-100">
                <span className="font-bold text-slate-900 block">{currentUser.name}</span>
                <span className="text-xs text-slate-500 block truncate">{currentUser.email}</span>
                <div className="mt-1 flex items-center gap-1.5">
                  <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 uppercase tracking-wider border border-blue-200/60">
                    {currentUser.role}
                  </span>
                  {currentUser.company && (
                    <span className="text-[11px] text-slate-500 truncate" title={currentUser.company}>
                      {currentUser.company}
                    </span>
                  )}
                </div>
              </div>

              {/* Opciones del menú (Requirement 12) */}
              <div className="py-1">
                {/* 1. Mi perfil */}
                <button
                  onClick={() => {
                    setProfileDropdownOpen(false);
                    setIsProfileModalOpen(true);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2 cursor-pointer transition-colors text-slate-700 font-medium"
                >
                  <span className="material-symbols-outlined text-base text-slate-400">person</span>
                  <span>Mi perfil</span>
                </button>

                {/* 2. Cambiar contraseña */}
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
              </div>

              {/* Selector demo opcional solo con flag NEXT_PUBLIC_DEV_ROLE_SWITCH=true */}
              {showDevRoleSwitch && onSwitchUser && (
                <div className="border-t border-slate-100 py-1 bg-slate-50/50">
                  <span className="px-4 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Cambiar rol demo
                  </span>
                  {(['admin', 'supervisor', 'agente', 'cliente'] as UserRole[]).map((r) => (
                    <button
                      key={r}
                      onClick={() => {
                        onSwitchUser(r);
                        setProfileDropdownOpen(false);
                      }}
                      className={`w-full text-left px-4 py-1.5 hover:bg-slate-100 flex items-center justify-between cursor-pointer transition-colors text-xs ${
                        currentUser.role === r ? 'font-bold text-blue-700' : 'text-slate-600'
                      }`}
                    >
                      <span className="capitalize">{r}</span>
                      {currentUser.role === r && (
                        <span className="material-symbols-outlined text-sm">check</span>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {/* 3. Cerrar sesión (Requirement 12) */}
              <div className="border-t border-slate-100 pt-1">
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

      {/* Modal "Mi Perfil" (Requirement 12) */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-sm w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Mi perfil</h3>
              <button
                onClick={() => setIsProfileModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer p-1 rounded-lg"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>

            <div className="flex items-center gap-3">
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-14 h-14 rounded-full object-cover ring-2 ring-blue-600/30"
              />
              <div className="min-w-0">
                <h4 className="text-sm font-bold text-slate-900">{currentUser.name}</h4>
                <p className="text-xs text-slate-500 truncate">{currentUser.email}</p>
                <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200/60">
                  {currentUser.role}
                </span>
              </div>
            </div>

            <div className="space-y-2 text-xs pt-1">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-400">Cargo:</span>
                <span className="font-semibold text-slate-800">{currentUser.title}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-400">Empresa:</span>
                <span className="font-semibold text-slate-800">{currentUser.company || 'SFS'}</span>
              </div>
              {currentUser.phone && (
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-400">Teléfono:</span>
                  <span className="font-semibold text-slate-800">{currentUser.phone}</span>
                </div>
              )}
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <button
                onClick={() => {
                  setIsProfileModalOpen(false);
                  onNavigateToChangePassword();
                }}
                className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
              >
                <span className="material-symbols-outlined text-sm">lock_reset</span>
                <span>Cambiar contraseña</span>
              </button>
              <button
                onClick={() => setIsProfileModalOpen(false)}
                className="w-full py-2 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold text-xs cursor-pointer transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
