import React, { useState } from 'react';
import { SfsLogo } from './SfsLogo';
import { User } from '../types';

interface ChangePasswordViewProps {
  currentUser: User;
  onPasswordChanged: (updatedUser: User) => void;
  onCancel?: () => void;
}

export const ChangePasswordView: React.FC<ChangePasswordViewProps> = ({
  currentUser,
  onPasswordChanged,
  onCancel
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
      const { cambiarContrasenaUsuario } = await import('../../lib/auth');
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

  return (
    <div className="min-h-screen w-screen flex flex-col justify-center items-center p-4 sm:p-6 bg-[#F5F7FB] font-sans antialiased text-slate-800 select-none">
      <div className="w-full max-w-[440px] space-y-4">
        {/* Placa superior con Logo */}
        <div className="text-center">
          <div className="inline-block bg-white px-5 py-3 rounded-2xl shadow-sm mb-2">
            <SfsLogo className="w-full max-w-[200px] h-auto object-contain" />
          </div>
        </div>

        {/* Tarjeta del Formulario */}
        <div className="bg-white rounded-3xl p-7 sm:p-8 shadow-xl border border-slate-200/80 space-y-6">
          <div className="space-y-1 text-center">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center mx-auto mb-2">
              <span className="material-symbols-outlined text-xl">lock_reset</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Actualizar contraseña
            </h1>
            <p className="text-xs text-slate-500">
              {currentUser.mustChangePassword
                ? 'Por políticas de seguridad, debes actualizar tu clave temporal antes de continuar.'
                : 'Configura una nueva clave segura para el ingreso a tu cuenta.'}
            </p>
          </div>

          {/* Alerta de Error */}
          {errorMessage && (
            <div
              role="alert"
              className="p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-2.5 text-xs text-rose-700 animate-in fade-in"
            >
              <span className="material-symbols-outlined text-base text-rose-600 flex-shrink-0">
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
                className="block text-xs font-semibold text-slate-700 mb-1"
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
                  className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600 focus:outline-none transition-all"
                  placeholder="••••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  aria-label={showCurrent ? 'Ocultar contraseña actual' : 'Mostrar contraseña actual'}
                  className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-700 p-0.5 rounded cursor-pointer transition-colors focus:ring-2 focus:ring-blue-600 focus:outline-none"
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
                className="block text-xs font-semibold text-slate-700 mb-1"
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
                  className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600 focus:outline-none transition-all"
                  placeholder="Mínimo 10 caracteres alfanuméricos..."
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  aria-label={showNew ? 'Ocultar nueva contraseña' : 'Mostrar nueva contraseña'}
                  className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-700 p-0.5 rounded cursor-pointer transition-colors focus:ring-2 focus:ring-blue-600 focus:outline-none"
                >
                  <span className="material-symbols-outlined text-lg leading-none">
                    {showNew ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>

              {/* Indicador de Fortaleza (Requirement 11) */}
              <div className="mt-2 space-y-1">
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden flex gap-1">
                  <div
                    className={`h-full flex-1 transition-all ${
                      strength.score >= 1 ? strength.color : 'bg-slate-200'
                    }`}
                  />
                  <div
                    className={`h-full flex-1 transition-all ${
                      strength.score >= 2 ? strength.color : 'bg-slate-200'
                    }`}
                  />
                  <div
                    className={`h-full flex-1 transition-all ${
                      strength.score >= 3 ? strength.color : 'bg-slate-200'
                    }`}
                  />
                  <div
                    className={`h-full flex-1 transition-all ${
                      strength.score >= 4 ? strength.color : 'bg-slate-200'
                    }`}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">Fortaleza:</span>
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
                className="block text-xs font-semibold text-slate-700 mb-1"
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
                  className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600 focus:outline-none transition-all"
                  placeholder="Repite la nueva contraseña..."
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  aria-label={showConfirm ? 'Ocultar confirmación' : 'Mostrar confirmación'}
                  className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-700 p-0.5 rounded cursor-pointer transition-colors focus:ring-2 focus:ring-blue-600 focus:outline-none"
                >
                  <span className="material-symbols-outlined text-lg leading-none">
                    {showConfirm ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            {/* Botones */}
            <div className="pt-2 flex items-center gap-2.5">
              {onCancel && !currentUser.mustChangePassword && (
                <button
                  type="button"
                  onClick={onCancel}
                  className="flex-1 py-2.5 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
              )}
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 py-2.5 px-4 rounded-xl bg-blue-700 hover:bg-blue-800 disabled:bg-blue-400 text-white font-bold text-xs shadow-md shadow-blue-900/10 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] focus:ring-2 focus:ring-blue-600 focus:outline-none"
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
