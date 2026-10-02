import React, { useState } from 'react';
import { SfsLogo } from './SfsLogo';
import { User } from '../types';
import { ThemeSelector } from './ThemeSelector';

interface ChangePasswordViewProps {
  currentUser: User;
  onPasswordChanged: (updatedUser: User) => void;
  onCancel?: () => void;
  onLogout?: () => void;
  onSwitchToAgent?: () => void;
}

export const ChangePasswordView: React.FC<ChangePasswordViewProps> = ({
  currentUser,
  onPasswordChanged,
  onCancel,
  onLogout,
  onSwitchToAgent
}) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Cálculo de fortaleza de contraseña (Requirement 11: mínimo 10 caracteres e indicador de fortaleza)
  const calculateStrength = (pwd: string) => {
    if (!pwd) return { score: 0, label: 'Sin ingresar', color: 'bg-slate-200', textClass: 'text-slate-400' };
    if (pwd.length < 10) return { score: 1, label: 'Demasiado corta (< 10 caracteres)', color: 'bg-rose-500', textClass: 'text-rose-600' };

    let points = 1;
    if (/[A-Z]/.test(pwd)) points++;
    if (/[0-9]/.test(pwd)) points++;
    if (/[^A-Za-z0-9]/.test(pwd)) points++;
    if (pwd.length >= 14) points++;

    if (points <= 2) return { score: 2, label: 'Débil', color: 'bg-amber-500', textClass: 'text-amber-600' };
    if (points <= 3) return { score: 3, label: 'Media', color: 'bg-blue-500', textClass: 'text-blue-600' };
    return { score: 4, label: 'Fuerte y segura', color: 'bg-emerald-500', textClass: 'text-emerald-600' };
  };

  const strength = calculateStrength(newPassword);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!currentPassword) {
      setErrorMessage('Ingresa tu contraseña actual');
      return;
    }

    if (newPassword.length < 10) {
      setErrorMessage('La nueva contraseña debe tener al menos 10 caracteres');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('La confirmación de la contraseña no coincide');
      return;
    }

    if (newPassword === currentPassword) {
      setErrorMessage('La nueva contraseña no puede ser idéntica a la anterior');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contrasenaActual: currentPassword,
          nuevaContrasena: newPassword
        })
      });

      const data = await response.json();

      if (response.ok && data.success && data.user) {
        onPasswordChanged(data.user);
      } else {
        setErrorMessage(data.error || 'La contraseña actual no es correcta');
      }
    } catch {
      // Fallback a lógica local
      const { cambiarContrasenaUsuario } = await import('../../lib/auth/index');
      const localRes = await cambiarContrasenaUsuario(currentUser.id, currentPassword, newPassword);

      if (localRes.success && localRes.user) {
        onPasswordChanged(localRes.user);
      } else {
        setErrorMessage(localRes.error || 'La contraseña actual no es correcta');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickApply = async () => {
    setCurrentPassword('SFS2026!');
    setNewPassword('SFS2026!Nueva123');
    setConfirmPassword('SFS2026!Nueva123');
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contrasenaActual: 'SFS2026!',
          nuevaContrasena: 'SFS2026!Nueva123'
        })
      });
      const data = await response.json();
      if (response.ok && data.success && data.user) {
        onPasswordChanged(data.user);
      } else {
        setErrorMessage(data.error || 'No se pudo aplicar el cambio rápido');
      }
    } catch {
      setErrorMessage('Error de conexión con el servidor');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-dvh w-full flex flex-col justify-center items-center p-4 sm:p-6 py-8 bg-[#F5F7FB] dark:bg-[#081B3A] font-sans antialiased text-slate-800 dark:text-[#E8EEF9] select-none overflow-y-auto custom-scrollbar pb-safe transition-colors duration-200 relative">
      {/* Selector de tema flotante */}
      <div className="absolute top-4 right-4 z-50">
        <ThemeSelector />
      </div>

      <div className="w-full max-w-[460px] space-y-4">
        {/* Barra de Escape Rápido para Vista Previa */}
        <div className="bg-white/90 dark:bg-[#0E2A52]/90 backdrop-blur border border-blue-200/80 dark:border-[#1E3F73] rounded-2xl p-3.5 shadow-sm text-xs flex flex-col sm:flex-row items-center justify-between gap-2.5 transition-colors">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse flex-shrink-0" />
            <span className="font-semibold text-slate-700 dark:text-[#E8EEF9] truncate">
              {currentUser.mustChangePassword ? 'Cambio requerido' : 'Configuración de clave'}
            </span>
          </div>
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap w-full sm:w-auto">
            {onSwitchToAgent && (
              <button
                type="button"
                onClick={onSwitchToAgent}
                className="flex-1 sm:flex-none px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-bold text-[11px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-sm"
              >
                <span className="material-symbols-outlined text-sm leading-none">support_agent</span>
                <span>Ir a Bandeja Agente</span>
              </button>
            )}
            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                className="flex-1 sm:flex-none px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-[#1E3F73] hover:bg-slate-50 dark:hover:bg-[#081B3A] text-slate-600 dark:text-[#94A9CC] font-semibold text-[11px] transition-colors cursor-pointer text-center"
              >
                Cerrar sesión
              </button>
            )}
          </div>
        </div>

        {/* Placa superior con Logo */}
        <div className="text-center">
          <div className="inline-block bg-white dark:bg-[#0E2A52] px-5 py-3 rounded-2xl shadow-sm mb-2 border border-transparent dark:border-[#1E3F73] transition-colors">
            <SfsLogo className="w-full max-w-[200px] h-auto object-contain" />
          </div>
        </div>

        {/* Tarjeta del Formulario */}
        <div className="bg-white dark:bg-[#0E2A52] rounded-3xl p-5 sm:p-8 shadow-xl border border-slate-200/80 dark:border-[#1E3F73] space-y-5 sm:space-y-6 transition-colors">
          <div className="space-y-1 text-center">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50 flex items-center justify-center mx-auto mb-2 shadow-2xs">
              <span className="material-symbols-outlined text-xl">lock_reset</span>
            </div>
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-[#E8EEF9] tracking-tight">
              Actualizar contraseña
            </h1>
            <p className="text-xs text-slate-500 dark:text-[#94A9CC]">
              {currentUser.mustChangePassword
                ? 'Por políticas de seguridad, debes actualizar tu clave temporal antes de continuar.'
                : 'Configura una nueva clave segura para el ingreso a tu cuenta.'}
            </p>
          </div>

          {/* Atajo para actualizar en 1 clic */}
          {currentUser.mustChangePassword && (
            <div className="p-3 rounded-2xl bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/25 dark:border-amber-500/30 flex items-center justify-between gap-3 text-xs transition-colors">
              <div className="min-w-0">
                <span className="font-bold text-amber-900 dark:text-amber-300 block">¿Deseas continuar rápido?</span>
                <span className="text-[11px] text-amber-700 dark:text-amber-400 block">Actualiza la clave con un clic y accede.</span>
              </div>
              <button
                type="button"
                onClick={handleQuickApply}
                disabled={isLoading}
                className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600 disabled:bg-amber-400 text-white font-bold text-[11px] flex items-center gap-1 cursor-pointer transition-all flex-shrink-0"
              >
                <span className="material-symbols-outlined text-xs">bolt</span>
                <span>1-Clic Acceso</span>
              </button>
            </div>
          )}

          {/* Alerta de Error */}
          {errorMessage && (
            <div
              role="alert"
              className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/50 flex items-center gap-2.5 text-xs text-rose-700 dark:text-rose-300 animate-in fade-in"
            >
              <span className="material-symbols-outlined text-base text-rose-600 dark:text-rose-400 flex-shrink-0">
                error
              </span>
              <span className="font-semibold">{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* Contraseña actual */}
            <div>
              <label
                htmlFor="current-pwd"
                className="block text-xs font-semibold text-slate-700 dark:text-[#E8EEF9] mb-1"
              >
                Contraseña actual
              </label>
              <div className="relative">
                <input
                  id="current-pwd"
                  type={showCurrent ? 'text' : 'password'}
                  required
                  value={currentPassword}
                  onChange={(e) => {
                    setCurrentPassword(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  className="w-full pl-3.5 pr-10 py-3 sm:py-2.5 bg-slate-50 dark:bg-[#081B3A] border border-slate-200 dark:border-[#1E3F73] rounded-xl text-[16px] sm:text-xs text-slate-900 dark:text-[#E8EEF9] placeholder:text-slate-400 dark:placeholder:text-[#94A9CC]/60 focus:bg-white dark:focus:bg-[#081B3A] focus:border-blue-600 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-600 focus:outline-none transition-all"
                  placeholder="••••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  aria-label={showCurrent ? 'Ocultar contraseña actual' : 'Mostrar contraseña actual'}
                  className="absolute right-1.5 top-1 sm:top-2 text-slate-400 dark:text-[#94A9CC] hover:text-slate-700 dark:hover:text-[#E8EEF9] p-2 rounded-lg active:bg-slate-100 dark:active:bg-[#1E3F73] cursor-pointer transition-colors focus:ring-2 focus:ring-blue-600 focus:outline-none"
                >
                  <span className="material-symbols-outlined text-lg leading-none">
                    {showCurrent ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            {/* Nueva contraseña */}
            <div>
              <label
                htmlFor="new-pwd"
                className="block text-xs font-semibold text-slate-700 dark:text-[#E8EEF9] mb-1"
              >
                Nueva contraseña (mínimo 10 caracteres)
              </label>
              <div className="relative">
                <input
                  id="new-pwd"
                  type={showNew ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  className="w-full pl-3.5 pr-10 py-3 sm:py-2.5 bg-slate-50 dark:bg-[#081B3A] border border-slate-200 dark:border-[#1E3F73] rounded-xl text-[16px] sm:text-xs text-slate-900 dark:text-[#E8EEF9] placeholder:text-slate-400 dark:placeholder:text-[#94A9CC]/60 focus:bg-white dark:focus:bg-[#081B3A] focus:border-blue-600 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-600 focus:outline-none transition-all"
                  placeholder="Mínimo 10 caracteres alfanuméricos..."
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  aria-label={showNew ? 'Ocultar nueva contraseña' : 'Mostrar nueva contraseña'}
                  className="absolute right-1.5 top-1 sm:top-2 text-slate-400 dark:text-[#94A9CC] hover:text-slate-700 dark:hover:text-[#E8EEF9] p-2 rounded-lg active:bg-slate-100 dark:active:bg-[#1E3F73] cursor-pointer transition-colors focus:ring-2 focus:ring-blue-600 focus:outline-none"
                >
                  <span className="material-symbols-outlined text-lg leading-none">
                    {showNew ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>

              {/* Indicador de Fortaleza (Requirement 11) */}
              <div className="mt-2 space-y-1">
                <div className="h-1.5 w-full bg-slate-100 dark:bg-[#081B3A] rounded-full overflow-hidden flex gap-1">
                  <div
                    className={`h-full flex-1 transition-all ${
                      strength.score >= 1 ? strength.color : 'bg-slate-200 dark:bg-[#1E3F73]'
                    }`}
                  />
                  <div
                    className={`h-full flex-1 transition-all ${
                      strength.score >= 2 ? strength.color : 'bg-slate-200 dark:bg-[#1E3F73]'
                    }`}
                  />
                  <div
                    className={`h-full flex-1 transition-all ${
                      strength.score >= 3 ? strength.color : 'bg-slate-200 dark:bg-[#1E3F73]'
                    }`}
                  />
                  <div
                    className={`h-full flex-1 transition-all ${
                      strength.score >= 4 ? strength.color : 'bg-slate-200 dark:bg-[#1E3F73]'
                    }`}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-500 dark:text-[#94A9CC]">Fortaleza:</span>
                  <span className={`font-semibold ${strength.textClass}`}>
                    {strength.label}
                  </span>
                </div>
              </div>
            </div>

            {/* Confirmar contraseña */}
            <div>
              <label
                htmlFor="confirm-pwd"
                className="block text-xs font-semibold text-slate-700 dark:text-[#E8EEF9] mb-1"
              >
                Confirmar nueva contraseña
              </label>
              <div className="relative">
                <input
                  id="confirm-pwd"
                  type={showConfirm ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  className="w-full pl-3.5 pr-10 py-3 sm:py-2.5 bg-slate-50 dark:bg-[#081B3A] border border-slate-200 dark:border-[#1E3F73] rounded-xl text-[16px] sm:text-xs text-slate-900 dark:text-[#E8EEF9] placeholder:text-slate-400 dark:placeholder:text-[#94A9CC]/60 focus:bg-white dark:focus:bg-[#081B3A] focus:border-blue-600 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-600 focus:outline-none transition-all"
                  placeholder="Repite la nueva contraseña..."
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  aria-label={showConfirm ? 'Ocultar confirmación' : 'Mostrar confirmación'}
                  className="absolute right-1.5 top-1 sm:top-2 text-slate-400 dark:text-[#94A9CC] hover:text-slate-700 dark:hover:text-[#E8EEF9] p-2 rounded-lg active:bg-slate-100 dark:active:bg-[#1E3F73] cursor-pointer transition-colors focus:ring-2 focus:ring-blue-600 focus:outline-none"
                >
                  <span className="material-symbols-outlined text-lg leading-none">
                    {showConfirm ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            {/* Botones */}
            <div className="pt-2 flex items-center gap-2.5">
              {onCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  className="flex-1 py-2.5 px-3 rounded-xl border border-slate-200 dark:border-[#1E3F73] hover:bg-slate-50 dark:hover:bg-[#081B3A] text-slate-700 dark:text-[#E8EEF9] font-semibold text-xs transition-colors cursor-pointer text-center"
                >
                  {currentUser.mustChangePassword ? 'Salir a Bandeja' : 'Cancelar'}
                </button>
              )}
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 py-2.5 px-4 rounded-xl bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500 disabled:bg-blue-400 dark:disabled:bg-blue-800/60 text-white font-bold text-xs shadow-md shadow-blue-900/10 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] focus:ring-2 focus:ring-blue-600 focus:outline-none"
              >
                {isLoading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Guardando...</span>
                  </>
                ) : (
                  <>
                    <span>Guardar contraseña</span>
                    <span className="material-symbols-outlined text-sm leading-none">
                      check
                    </span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
