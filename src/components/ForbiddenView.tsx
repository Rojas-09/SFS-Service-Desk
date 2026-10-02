import React from 'react';
import { User } from '../types';

interface ForbiddenViewProps {
  currentUser: User;
  reason?: string;
  onBackToConsole: () => void;
}

export const ForbiddenView: React.FC<ForbiddenViewProps> = ({
  currentUser,
  reason,
  onBackToConsole
}) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 bg-[#F5F7FB] dark:bg-[#081B3A] min-h-0 h-full text-center select-none overflow-y-auto custom-scrollbar transition-colors duration-200">
      <div className="max-w-md w-full bg-white dark:bg-[#0E2A52] rounded-3xl p-5 sm:p-8 border border-slate-200/90 dark:border-[#1E3F73] shadow-lg space-y-5 transition-colors">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50 flex items-center justify-center mx-auto shadow-2xs">
          <span className="material-symbols-outlined text-3xl">lock</span>
        </div>

        <div className="space-y-2">
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/50">
            Error 403 · Acceso restringido
          </span>
          <h1 className="text-xl font-bold text-slate-900 dark:text-[#E8EEF9] tracking-tight">
            Sección no disponible para tu rol
          </h1>
          <p className="text-xs text-slate-600 dark:text-[#94A9CC] leading-relaxed">
            {reason ||
              `Tu cuenta con rol "${currentUser.role}" no tiene permisos para acceder a este módulo operativo.`}
          </p>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#081B3A] border border-slate-200/80 dark:border-[#1E3F73] text-left text-xs space-y-1.5 transition-colors">
          <div className="flex items-start sm:items-center justify-between gap-2 sm:gap-4 text-slate-500 dark:text-[#94A9CC]">
            <span className="shrink-0">Usuario autenticado:</span>
            <span className="font-bold text-slate-900 dark:text-[#E8EEF9] text-right break-words min-w-0">{currentUser.name}</span>
          </div>
          <div className="flex items-start sm:items-center justify-between gap-2 sm:gap-4 text-slate-500 dark:text-[#94A9CC]">
            <span className="shrink-0">Rol en el sistema:</span>
            <span className="font-semibold text-blue-700 dark:text-blue-400 capitalize text-right break-words min-w-0">{currentUser.role}</span>
          </div>
        </div>

        <div className="pt-2">
          <button
            onClick={onBackToConsole}
            className="w-full py-2.5 px-4 bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-900/10 cursor-pointer flex items-center justify-center gap-2 focus:ring-2 focus:ring-blue-600 focus:outline-none"
          >
            <span className="material-symbols-outlined text-base leading-none">arrow_back</span>
            <span>Volver a la bandeja de tickets</span>
          </button>
        </div>
      </div>
    </div>
  );
};
