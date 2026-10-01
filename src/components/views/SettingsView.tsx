import React, { useState } from 'react';
import { useTickets } from '../../context/TicketsContext';

interface SettingsViewProps {
  onBackToConsole: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onBackToConsole }) => {
  const { showToast } = useTickets();
  const [criticalSound, setCriticalSound] = useState(true);
  const [slaThreshold, setSlaThreshold] = useState('1');
  const [autoAssign, setAutoAssign] = useState(true);
  const [emailNotify, setEmailNotify] = useState(true);

  const handleSave = () => {
    showToast('Configuración operativa actualizada correctamente', { type: 'success' });
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-[#F5F7FB] p-3 sm:p-6 custom-scrollbar select-none">
      <div className="max-w-4xl mx-auto w-full space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={onBackToConsole}
              className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-blue-700 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer focus:ring-2 focus:ring-blue-600 focus:outline-none"
              title="Volver a la consola"
            >
              <span className="material-symbols-outlined text-lg leading-none">arrow_back</span>
            </button>
            <div>
              <h1 className="text-base sm:text-xl font-bold text-slate-900 tracking-tight">
                Configuración del sistema
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Parámetros de la mesa de ayuda, alertas automáticas y preferencias
              </p>
            </div>
          </div>

          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer focus:ring-2 focus:ring-blue-600 focus:outline-none"
          >
            Guardar cambios
          </button>
        </div>

        {/* Opciones */}
        <div className="bg-white rounded-3xl p-4 sm:p-6 border border-slate-200 shadow-sm space-y-4 sm:space-y-5 text-xs">
          <div className="flex items-center justify-between gap-3 p-3.5 sm:p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <div>
              <span className="font-bold text-slate-900 block text-xs">
                Alertas sonoras para incidentes críticos
              </span>
              <span className="text-slate-500 text-xs mt-0.5 block">
                Emitir aviso acústico ante nuevos tickets clasificados con prioridad crítica
              </span>
            </div>
            <input
              type="checkbox"
              checked={criticalSound}
              onChange={(e) => setCriticalSound(e.target.checked)}
              className="w-5 h-5 rounded text-blue-600 flex-shrink-0 cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between gap-3 p-3.5 sm:p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <div>
              <span className="font-bold text-slate-900 block text-xs">
                Umbral de advertencia pre-vencimiento SLA
              </span>
              <span className="text-slate-500 text-xs mt-0.5 block">
                Tiempo de anticipación antes de expirar el tiempo límite para activar semáforo de alerta
              </span>
            </div>
            <select
              value={slaThreshold}
              onChange={(e) => setSlaThreshold(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 font-semibold text-slate-800 focus:ring-2 focus:ring-blue-600 focus:outline-none"
            >
              <option value="0.5">30 minutos</option>
              <option value="1">1 hora</option>
              <option value="2">2 horas</option>
            </select>
          </div>

          <div className="flex items-center justify-between gap-3 p-3.5 sm:p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <div>
              <span className="font-bold text-slate-900 block text-xs">
                Asignación automática inteligente
              </span>
              <span className="text-slate-500 text-xs mt-0.5 block">
                Distribuir automáticamente casos nuevos entre agentes disponibles según carga de trabajo
              </span>
            </div>
            <input
              type="checkbox"
              checked={autoAssign}
              onChange={(e) => setAutoAssign(e.target.checked)}
              className="w-5 h-5 rounded text-blue-600 flex-shrink-0 cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between gap-3 p-3.5 sm:p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <div>
              <span className="font-bold text-slate-900 block text-xs">
                Notificaciones por correo a clientes
              </span>
              <span className="text-slate-500 text-xs mt-0.5 block">
                Enviar correo automático inmediato ante cambios de estado o respuestas técnicas
              </span>
            </div>
            <input
              type="checkbox"
              checked={emailNotify}
              onChange={(e) => setEmailNotify(e.target.checked)}
              className="w-5 h-5 rounded text-blue-600 flex-shrink-0 cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
