import React from 'react';
import { useTickets } from '../../context/TicketsContext';

interface MetricsViewProps {
  onBackToConsole: () => void;
}

export const MetricsView: React.FC<MetricsViewProps> = ({ onBackToConsole }) => {
  const { tickets, counts } = useTickets();

  const total = tickets.length;
  const resolved = tickets.filter(t => t.status === 'Resuelto' || t.status === 'Cerrado').length;
  const breached = tickets.filter(t => t.isBreached || t.slaMinutesRemaining <= 0).length;
  const compliance = total > 0 ? (((total - breached) / total) * 100).toFixed(1) : '100';

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-[#F5F7FB] p-6 custom-scrollbar select-none">
      <div className="max-w-6xl mx-auto w-full space-y-6">
        {/* Header con botón para volver a la consola */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBackToConsole}
              className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-blue-700 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer focus:ring-2 focus:ring-blue-600 focus:outline-none"
              title="Volver a la consola"
            >
              <span className="material-symbols-outlined text-lg leading-none">arrow_back</span>
            </button>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Métricas y acuerdos SLA
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Dashboard analítico de rendimiento y cumplimiento de servicio
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              SLA general: {compliance}%
            </span>
          </div>
        </div>

        {/* 4 KPIs Clave */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Tickets activos
            </span>
            <span className="text-2xl font-bold font-mono text-slate-900 block mt-1">
              {counts.activos}
            </span>
            <span className="text-xs text-blue-600 font-semibold">En gestión activa</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Cumplimiento SLA
            </span>
            <span className="text-2xl font-bold font-mono text-emerald-700 block mt-1">
              {compliance}%
            </span>
            <span className="text-xs text-emerald-600 font-semibold">Meta &gt; 96.0%</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Tiempo 1ª respuesta
            </span>
            <span className="text-2xl font-bold font-mono text-blue-700 block mt-1">
              18 min 40 s
            </span>
            <span className="text-xs text-blue-600 font-semibold">Meta &lt; 30 min</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Tickets resueltos
            </span>
            <span className="text-2xl font-bold font-mono text-emerald-700 block mt-1">
              {resolved}
            </span>
            <span className="text-xs text-slate-500">Total histórico</span>
          </div>
        </div>

        {/* Desglose de Severidad y Acuerdos */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Distribución por prioridad y tiempo pactado
          </h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-rose-700">Crítica (SLA: 45 min)</span>
                <span className="text-slate-700 font-mono">
                  {tickets.filter(t => t.priority === 'Crítica').length} tickets
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div className="bg-rose-600 h-2.5 rounded-full" style={{ width: '25%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-orange-700">Alta (SLA: 2 h 00 min)</span>
                <span className="text-slate-700 font-mono">
                  {tickets.filter(t => t.priority === 'Alta').length} tickets
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div className="bg-[#F37021] h-2.5 rounded-full" style={{ width: '45%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-blue-700">Media (SLA: 6 h 00 min)</span>
                <span className="text-slate-700 font-mono">
                  {tickets.filter(t => t.priority === 'Media').length} tickets
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: '60%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-slate-700">Baja (SLA: 24 h 00 min)</span>
                <span className="text-slate-700 font-mono">
                  {tickets.filter(t => t.priority === 'Baja').length} tickets
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div className="bg-slate-400 h-2.5 rounded-full" style={{ width: '80%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
