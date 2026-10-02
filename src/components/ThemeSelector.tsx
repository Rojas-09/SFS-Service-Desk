import React, { useState, useEffect } from 'react';

export type ThemeMode = 'claro' | 'oscuro' | 'sistema';

export const ThemeSelector: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const [theme, setTheme] = useState<ThemeMode>(() => {
    try {
      const stored = localStorage.getItem('sfs_tema') as ThemeMode | null;
      if (stored === 'claro' || stored === 'oscuro' || stored === 'sistema') {
        return stored;
      }
    } catch {}
    return 'sistema';
  });
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('sfs_tema') as ThemeMode | null;
      if (stored === 'claro' || stored === 'oscuro' || stored === 'sistema') {
        applyTheme(stored);
      } else {
        applyTheme('sistema');
      }
    } catch {
      applyTheme('sistema');
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemChange = () => {
      const currentStored = localStorage.getItem('sfs_tema') as ThemeMode | null;
      if (!currentStored || currentStored === 'sistema') {
        applyTheme('sistema');
      }
    };

    mediaQuery.addEventListener('change', handleSystemChange);
    return () => mediaQuery.removeEventListener('change', handleSystemChange);
  }, []);

  const applyTheme = (mode: ThemeMode) => {
    const isDark =
      mode === 'oscuro' ||
      (mode === 'sistema' && typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);

    if (isDark) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
      document.documentElement.setAttribute('data-theme', 'light');
    }
  };

  const handleSelect = (mode: ThemeMode) => {
    setTheme(mode);
    try {
      localStorage.setItem('sfs_tema', mode);
    } catch {}
    applyTheme(mode);
    setIsOpen(false);
  };

  // Botón que cicla entre los tres estados al hacer click directo
  const handleCycle = () => {
    const next: ThemeMode = theme === 'claro' ? 'oscuro' : theme === 'oscuro' ? 'sistema' : 'claro';
    handleSelect(next);
  };

  const isCurrentDark =
    theme === 'oscuro' ||
    (theme === 'sistema' && typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);

  const getIcon = () => {
    if (theme === 'claro') return 'light_mode';
    if (theme === 'oscuro') return 'dark_mode';
    return 'brightness_auto';
  };

  const getLabel = () => {
    if (theme === 'claro') return 'Claro';
    if (theme === 'oscuro') return 'Oscuro';
    return 'Sistema';
  };

  return (
    <div className="relative inline-flex items-center">
      {/* Grupo de 3 botones small en pantallas grandes / escritorio */}
      <div className="hidden lg:inline-flex items-center p-0.5 rounded-xl bg-slate-100 dark:bg-[#081B3A] border border-slate-200/80 dark:border-[#1E3F73] transition-colors duration-200">
        <button
          type="button"
          onClick={() => handleSelect('claro')}
          className={`px-2 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-all cursor-pointer ${
            theme === 'claro'
              ? 'bg-white text-amber-600 shadow-xs dark:bg-[#0E2A52] dark:text-amber-400'
              : 'text-slate-500 hover:text-slate-800 dark:text-[#94A9CC] dark:hover:text-[#E8EEF9]'
          }`}
          title="Modo claro"
          aria-label="Modo claro"
        >
          <span className="material-symbols-outlined text-sm leading-none">light_mode</span>
          <span className="sr-only sm:not-sr-only text-[10px]">Claro</span>
        </button>

        <button
          type="button"
          onClick={() => handleSelect('oscuro')}
          className={`px-2 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-all cursor-pointer ${
            theme === 'oscuro'
              ? 'bg-white text-blue-700 shadow-xs dark:bg-[#0E2A52] dark:text-blue-400'
              : 'text-slate-500 hover:text-slate-800 dark:text-[#94A9CC] dark:hover:text-[#E8EEF9]'
          }`}
          title="Modo oscuro"
          aria-label="Modo oscuro"
        >
          <span className="material-symbols-outlined text-sm leading-none">dark_mode</span>
          <span className="sr-only sm:not-sr-only text-[10px]">Oscuro</span>
        </button>

        <button
          type="button"
          onClick={() => handleSelect('sistema')}
          className={`px-2 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-all cursor-pointer ${
            theme === 'sistema'
              ? 'bg-white text-slate-800 shadow-xs dark:bg-[#0E2A52] dark:text-[#E8EEF9]'
              : 'text-slate-500 hover:text-slate-800 dark:text-[#94A9CC] dark:hover:text-[#E8EEF9]'
          }`}
          title="Modo automático del sistema"
          aria-label="Modo automático del sistema"
        >
          <span className="material-symbols-outlined text-sm leading-none">brightness_auto</span>
          <span className="sr-only sm:not-sr-only text-[10px]">Auto</span>
        </button>
      </div>

      {/* Botón único ciclable para pantallas compactas / móviles (< 1024px) */}
      <div className="lg:hidden relative">
        <button
          type="button"
          onClick={handleCycle}
          className="p-2 rounded-xl text-slate-500 dark:text-[#94A9CC] hover:text-slate-800 dark:hover:text-[#E8EEF9] hover:bg-slate-100 dark:hover:bg-[#081B3A] active:bg-slate-200 dark:active:bg-[#1E3F73] cursor-pointer transition-colors relative flex items-center justify-center focus:ring-2 focus:ring-blue-600 focus:outline-none"
          title={`Tema: ${getLabel()} (clic para cambiar)`}
          aria-label={`Tema: ${getLabel()}`}
        >
          <span className="material-symbols-outlined text-xl">{getIcon()}</span>
          {theme === 'sistema' && (
            <span className="absolute bottom-1 right-1 w-1.5 h-1.5 rounded-full bg-blue-500" />
          )}
        </button>
      </div>
    </div>
  );
};
