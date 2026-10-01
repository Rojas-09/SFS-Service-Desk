import React, { useState } from 'react';
import { SfsLogo } from './SfsLogo';
import { User } from '../types';

interface LoginViewProps {
  onLoginSuccess: (user: User) => void;
  onShowToast: (message: string) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess, onShowToast }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Selector DEV (Requirement 2 - K9): elimina ?dev=true.
  // Las cuentas de prueba solo existen con import.meta.env.DEV en true; en producción se eliminan del bundle.
  const showDevAccounts = Boolean(import.meta.env.DEV);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const emailTrimmed = email.trim();
    if (!emailTrimmed) {
      setErrorMessage('Ingresa un correo válido');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailTrimmed)) {
      setErrorMessage('Ingresa un correo válido');
      return;
    }

    if (!password) {
      setErrorMessage('Correo o contraseña incorrectos');
      return;
    }

    setIsLoading(true);

    try {
      // Intentar login vía endpoint/server action
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailTrimmed, password })
      });

      const data = await response.json();

      if (response.ok && data.success && data.user) {
        onLoginSuccess(data.user);
      } else {
        setErrorMessage(data.error || 'Correo o contraseña incorrectos');
      }
    } catch {
      // Si la API remota no responde directamente, invocar validación local del módulo auth
      const { iniciarSesion } = await import('../../lib/auth/index');
      const localResult = await iniciarSesion(emailTrimmed, password);

      if (localResult.success && localResult.user) {
        onLoginSuccess(localResult.user);
      } else {
        setErrorMessage(localResult.error || 'Correo o contraseña incorrectos');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleUseDemoAccount = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('SFS2026!');
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen w-screen flex bg-[#F5F7FB] font-sans antialiased text-slate-800 select-none">
      {/* ================= PANEL IZQUIERDO (ESCRITORIO): AZUL MARINO #0B2A5B ================= */}
      {/* Requirement 7: Pantalla dividida con eslogan y 3 puntos de valor */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#0B2A5B] flex-col justify-between p-12 text-white relative overflow-hidden">
        {/* Adorno decorativo de fondo */}
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-blue-600/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-[#F37021]/10 blur-3xl pointer-events-none" />

        {/* Logo superior en placa blanca con padding */}
        <div className="relative z-10">
          <div className="inline-block bg-white p-3 rounded-2xl shadow-md">
            <SfsLogo className="w-full max-w-[200px] h-auto object-contain" />
          </div>
        </div>

        {/* Eslogan y Puntos de valor */}
        <div className="relative z-10 max-w-lg space-y-8 my-auto py-8">
          <div className="space-y-3">
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-white/10 text-blue-200 border border-white/15">
              Service Desk Corporativo
            </span>
            <h1 className="text-3xl xl:text-4xl font-extrabold tracking-tight text-white leading-tight">
              Soporte técnico ágil para tu operación
            </h1>
            <p className="text-sm text-blue-100/90 leading-relaxed">
              Mesa de ayuda especializada para clientes y equipos técnicos de Software Factory and Services.
            </p>
          </div>

          {/* 3 Puntos de valor con icono (Requirement 7) */}
          <div className="space-y-4 pt-2">
            <div className="flex items-start gap-3.5 p-3 rounded-2xl bg-white/5 border border-white/10 transition-colors">
              <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-300 flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-xl">speed</span>
              </div>
              <div>
                <h3 className="text-xs font-bold text-white tracking-wide">
                  Seguimiento en tiempo real
                </h3>
                <p className="text-xs text-blue-200/80 mt-0.5 leading-snug">
                  Monitorea el avance de tus solicitudes minuto a minuto sin fricción.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-3 rounded-2xl bg-white/5 border border-white/10 transition-colors">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-xl">verified</span>
              </div>
              <div>
                <h3 className="text-xs font-bold text-white tracking-wide">
                  Respuesta bajo SLA
                </h3>
                <p className="text-xs text-blue-200/80 mt-0.5 leading-snug">
                  Cumplimiento riguroso de tiempos de atención y acuerdos de servicio establecidos.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-3 rounded-2xl bg-white/5 border border-white/10 transition-colors">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-xl">history_edu</span>
              </div>
              <div>
                <h3 className="text-xs font-bold text-white tracking-wide">
                  Historial de tus solicitudes
                </h3>
                <p className="text-xs text-blue-200/80 mt-0.5 leading-snug">
                  Trazabilidad integral, auditoría y consulta de incidentes y soluciones pasadas.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer izquierdo */}
        <div className="relative z-10 text-xs text-blue-200/70 font-medium">
          Software Factory and Services © 2026 · Todos los derechos reservados
        </div>
      </div>

      {/* ================= PANEL DERECHO: TARJETA DE LOGIN (400 PX CENTRADA) ================= */}
      {/* Requirement 7: En móvil solo la tarjeta sobre #F5F7FB */}
      <div className="flex-1 flex flex-col justify-center items-center p-4 sm:p-8 overflow-y-auto custom-scrollbar">
        <div className="w-full max-w-[400px] flex flex-col items-center">
          {/* Tarjeta Blanca Centrada */}
          <div className="w-full bg-white rounded-3xl p-7 sm:p-8 shadow-xl border border-slate-200/80 space-y-6">
            {/* Logo siempre sobre fondo blanco (Requirement 7) */}
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="w-full max-w-[240px] flex items-center justify-center py-1">
                <SfsLogo className="w-full max-w-[240px] h-auto object-contain" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                  Inicia sesión
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Ingresa tus credenciales para acceder a la mesa de ayuda
                </p>
              </div>
            </div>

            {/* Mensaje de error accesible (Requirement 9) */}
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

            {/* Formulario de Login (Requirement 8 & 9) */}
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {/* Campo Correo electrónico con etiqueta visible */}
              <div>
                <label
                  htmlFor="login-email"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  Correo electrónico
                </label>
                <input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600 focus:outline-none transition-all"
                  placeholder="ejemplo@empresa.com"
                />
              </div>

              {/* Campo Contraseña con botón mostrar/ocultar y aria-label */}
              <div>
                <label
                  htmlFor="login-password"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  Contraseña
                </label>
                <div className="relative">
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600 focus:outline-none transition-all"
                    placeholder="••••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-700 p-0.5 rounded cursor-pointer transition-colors focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  >
                    <span className="material-symbols-outlined text-lg leading-none">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Opciones: Recordarme y ¿Olvidaste tu contraseña? */}
              <div className="flex items-center justify-between pt-0.5">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-700 focus:ring-blue-600 border-slate-300"
                  />
                  <span className="text-xs text-slate-600 font-medium">Recordarme</span>
                </label>

                <button
                  type="button"
                  onClick={() => onShowToast('Contacta a tu administrador de SFS')}
                  className="text-xs font-semibold text-blue-700 hover:text-blue-900 hover:underline cursor-pointer focus:ring-2 focus:ring-blue-600 focus:outline-none rounded"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>

              {/* Botón azul rey "Ingresar" con spinner (Requirement 8 & 9) */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 px-4 rounded-xl bg-blue-700 hover:bg-blue-800 disabled:bg-blue-400 text-white font-bold text-xs shadow-md shadow-blue-900/10 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] focus:ring-2 focus:ring-blue-600 focus:outline-none"
                >
                  {isLoading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Ingresando...</span>
                    </>
                  ) : (
                    <>
                      <span>Ingresar</span>
                      <span className="material-symbols-outlined text-sm leading-none">
                        arrow_forward
                      </span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Bloque "Cuentas de prueba" (Requirement 10: solo con DEV_ROLE_SWITCH) */}
          {showDevAccounts && (
            <div className="w-full mt-4 bg-white/90 backdrop-blur-xs rounded-2xl p-4 border border-slate-200/90 shadow-sm space-y-2.5 text-xs animate-in fade-in">
              <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm text-[#F37021]">key</span>
                  <span>Cuentas de prueba</span>
                </span>
                <span className="text-[11px] text-slate-500 font-mono">Clave: SFS2026!</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {/* 1. Cliente con mustChangePassword */}
                <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div className="min-w-0 pr-1">
                    <span className="font-bold text-slate-900 block truncate">Cliente</span>
                    <span className="text-[11px] text-slate-500 block truncate">
                      cliente@trilladoralamanuela.co
                    </span>
                    <span className="text-[10px] text-amber-700 font-semibold block">
                      ★ Cambio de clave req.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleUseDemoAccount('cliente@trilladoralamanuela.co')}
                    className="px-2 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 text-[11px] font-bold cursor-pointer transition-colors flex-shrink-0"
                  >
                    Usar
                  </button>
                </div>

                {/* 2. Agente */}
                <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div className="min-w-0 pr-1">
                    <span className="font-bold text-slate-900 block truncate">Agente L2</span>
                    <span className="text-[11px] text-slate-500 block truncate">
                      agente@sfs.co
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleUseDemoAccount('agente@sfs.co')}
                    className="px-2 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 text-[11px] font-bold cursor-pointer transition-colors flex-shrink-0"
                  >
                    Usar
                  </button>
                </div>

                {/* 3. Supervisor */}
                <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div className="min-w-0 pr-1">
                    <span className="font-bold text-slate-900 block truncate">Supervisor</span>
                    <span className="text-[11px] text-slate-500 block truncate">
                      supervisor@sfs.co
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleUseDemoAccount('supervisor@sfs.co')}
                    className="px-2 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 text-[11px] font-bold cursor-pointer transition-colors flex-shrink-0"
                  >
                    Usar
                  </button>
                </div>

                {/* 4. Administrador */}
                <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div className="min-w-0 pr-1">
                    <span className="font-bold text-slate-900 block truncate">Administrador</span>
                    <span className="text-[11px] text-slate-500 block truncate">
                      admin@sfs.co
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleUseDemoAccount('admin@sfs.co')}
                    className="px-2 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 text-[11px] font-bold cursor-pointer transition-colors flex-shrink-0"
                  >
                    Usar
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
