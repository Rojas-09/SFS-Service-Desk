import React from 'react';
import { useTickets } from '../../context/TicketsContext';
import { MetricsCharts } from './MetricsCharts';

interface MetricsViewProps {
  onBackToConsole: () => void;
}

export const MetricsView: React.FC<MetricsViewProps> = ({ onBackToConsole }) => {
  const { tickets, counts, kpis } = useTickets();

  const total = tickets.length;
  const resolved = tickets.filter(t => t.status === 'Resuelto' || t.status === 'Cerrado').length;
  const compliance = kpis.slaCompliancePercent;

  const criticosCount = tickets.filter(t => t.priority === 'Crítica').length;
  const altosCount = tickets.filter(t => t.priority === 'Alta').length;
  const mediosCount = tickets.filter(t => t.priority === 'Media').length;
  const bajosCount = tickets.filter(t => t.priority === 'Baja').length;

  const getPercent = (count: number) => (total > 0 ? ((count / total) * 100).toFixed(0) : '0');

  // Exportar CSV oficial con codificación UTF-8 BOM y punto y coma
  const handleExportCsv = () => {
    const headers = [
      'Número',
      'Asunto',
      'Empresa',
      'Categoría',
      'Prioridad',
      'Estado',
      'Agente Asignado',
      'SLA Restante'
    ];

    const rows = tickets.map((t) => [
      t.code,
      `"${(t.title || '').replace(/"/g, '""')}"`,
      `"${(t.company || '').replace(/"/g, '""')}"`,
      `"${(t.category || '').replace(/"/g, '""')}"`,
      t.priority || '',
      t.status || '',
      `"${(t.assignedAgent?.name || 'Sin asignar').replace(/"/g, '""')}"`,
      `"${(t.slaFormatted || (t.slaMinutesRemaining !== undefined ? `${t.slaMinutesRemaining} min` : 'N/A')).replace(/"/g, '""')}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `SFS_Metricas_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-[#F5F7FB] dark:bg-[#081B3A] text-slate-800 dark:text-[#E8EEF9] p-3 sm:p-6 custom-scrollbar select-none transition-colors duration-200">
      <div className="max-w-6xl mx-auto w-full space-y-4 sm:space-y-6">
        {/* Header con botón para volver a la consola y exportación CSV */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={onBackToConsole}
              className="p-2 rounded-xl bg-white dark:bg-[#0E2A52] border border-slate-200 dark:border-[#1E3F73] text-slate-600 dark:text-[#E8EEF9] hover:text-blue-700 dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-[#081B3A] transition-colors shadow-2xs cursor-pointer focus:ring-2 focus:ring-blue-600 focus:outline-none"
              title="Volver a la consola"
            >
              <span className="material-symbols-outlined text-lg leading-none">arrow_back</span>
            </button>
            <div>
              <h1 className="text-base sm:text-xl font-bold text-slate-900 dark:text-[#E8EEF9] tracking-tight">
                Métricas y acuerdos SLA
              </h1>
              <p className="text-xs text-slate-500 dark:text-[#94A9CC] mt-0.5">
                Dashboard analítico de rendimiento y cumplimiento de servicio en horario hábil Colombia
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
              SLA general: {compliance}%
            </span>
            <button
              onClick={handleExportCsv}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-[#0E2A52] border border-slate-200 dark:border-[#1E3F73] text-slate-700 dark:text-[#E8EEF9] hover:text-blue-700 dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-[#081B3A] transition-colors shadow-2xs cursor-pointer focus:ring-2 focus:ring-blue-600 focus:outline-none text-xs font-semibold"
              title="Exportar datos visibles a CSV"
            >
              <span className="material-symbols-outlined text-lg leading-none">download</span>
              <span>Exportar CSV</span>
            </button>
          </div>
        </div>

        {/* 4 KPIs Clave calculados dinámicamente desde los tickets (Requirement 8) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-[#0E2A52] p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-[#1E3F73] shadow-2xs">
            <span className="text-xs font-bold text-slate-500 dark:text-[#94A9CC] uppercase tracking-wider block">
              Tickets activos
            </span>
            <span className="text-2xl font-bold font-mono text-slate-900 dark:text-[#E8EEF9] block mt-1">
              {counts.activos}
            </span>
            <span className="text-xs text-blue-600 dark:text-blue-400 font-semibold">En gestión activa</span>
          </div>

          <div className="bg-white dark:bg-[#0E2A52] p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-[#1E3F73] shadow-2xs">
            <span className="text-xs font-bold text-slate-500 dark:text-[#94A9CC] uppercase tracking-wider block">
              Cumplimiento SLA
            </span>
            <span className="text-2xl font-bold font-mono text-emerald-700 dark:text-emerald-400 block mt-1">
              {compliance}%
            </span>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">Calculado en tiempo real</span>
          </div>

          <div className="bg-white dark:bg-[#0E2A52] p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-[#1E3F73] shadow-2xs">
            <span className="text-xs font-bold text-slate-500 dark:text-[#94A9CC] uppercase tracking-wider block">
              Tiempo 1ª respuesta
            </span>
            <span className="text-2xl font-bold font-mono text-blue-700 dark:text-blue-400 block mt-1">
              {kpis.firstResponseTime}
            </span>
            <span className="text-xs text-blue-600 dark:text-blue-400 font-semibold">{kpis.firstResponseTarget}</span>
          </div>

          <div className="bg-white dark:bg-[#0E2A52] p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-[#1E3F73] shadow-2xs">
            <span className="text-xs font-bold text-slate-500 dark:text-[#94A9CC] uppercase tracking-wider block">
              Tickets resueltos
            </span>
            <span className="text-2xl font-bold font-mono text-emerald-700 dark:text-emerald-400 block mt-1">
              {resolved}
            </span>
            <span className="text-xs text-slate-500 dark:text-[#94A9CC]">De {total} tickets totales</span>
          </div>
        </div>

        {/* Gráficas de Datos (Recharts + Carga por Agente + Heatmap) */}
        <MetricsCharts tickets={tickets} />

        {/* Desglose de Severidad y Acuerdos con nuevos SLAs (Requirement 7) */}
        <div className="bg-white dark:bg-[#0E2A52] rounded-3xl p-4 sm:p-6 border border-slate-200 dark:border-[#1E3F73] shadow-sm space-y-4">
          <div className="flex flex-col sm:row sm:items-center justify-between gap-2">
            <h2 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-[#E8EEF9] uppercase tracking-wider leading-snug">
              Distribución por prioridad y acuerdos SLA (L–V 8:00 a. m.–6:00 p. m. Colombia)
            </h2>
            <span className="text-xs text-slate-500 dark:text-[#94A9CC] font-medium">1 día hábil = 10 horas</span>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between gap-3 text-xs font-semibold mb-1">
                <span className="text-rose-700 dark:text-rose-400 font-bold">Crítica (1 h primera resp. / 4 h solución)</span>
                <span className="text-slate-700 dark:text-[#94A9CC] font-mono">
                  {criticosCount} tickets ({getPercent(criticosCount)}%)
                </span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-[#081B3A] rounded-full h-2.5 overflow-hidden">
                <div className="bg-rose-600 h-2.5 rounded-full transition-all" style={{ width: `${getPercent(criticosCount)}%` }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between gap-3 text-xs font-semibold mb-1">
                <span className="text-orange-700 dark:text-orange-400 font-bold">Alta (4 h primera resp. / 1 día solución)</span>
                <span className="text-slate-700 dark:text-[#94A9CC] font-mono">
                  {altosCount} tickets ({getPercent(altosCount)}%)
                </span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-[#081B3A] rounded-full h-2.5 overflow-hidden">
                <div className="bg-[#F37021] h-2.5 rounded-full transition-all" style={{ width: `${getPercent(altosCount)}%` }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between gap-3 text-xs font-semibold mb-1">
                <span className="text-blue-700 dark:text-blue-400 font-bold">Media (8 h primera resp. / 3 días solución)</span>
                <span className="text-slate-700 dark:text-[#94A9CC] font-mono">
                  {mediosCount} tickets ({getPercent(mediosCount)}%)
                </span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-[#081B3A] rounded-full h-2.5 overflow-hidden">
                <div className="bg-blue-600 h-2.5 rounded-full transition-all" style={{ width: `${getPercent(mediosCount)}%` }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between gap-3 text-xs font-semibold mb-1">
                <span className="text-slate-700 dark:text-[#94A9CC] font-bold">Baja (1 día primera resp. / 5 días solución)</span>
                <span className="text-slate-700 dark:text-[#94A9CC] font-mono">
                  {bajosCount} tickets ({getPercent(bajosCount)}%)
                </span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-[#081B3A] rounded-full h-2.5 overflow-hidden">
                <div className="bg-slate-500 h-2.5 rounded-full transition-all" style={{ width: `${getPercent(bajosCount)}%` }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
