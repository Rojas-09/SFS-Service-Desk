import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import { Ticket, TicketStatus } from '../../types';

interface MetricsChartsProps {
  tickets: Ticket[];
}

// Brand Colors & State Colors (especificados exactamente por el usuario)
const BRAND_COLORS = {
  azulMarino: '#0B2A5B',
  azulRey: '#1565C0',
  azulClaro: '#3FA2E8',
  naranja: '#F37021'
};

const STATUS_COLORS: Record<TicketStatus, string> = {
  Nuevo: '#F59E0B',
  Asignado: '#64748B',
  'En progreso': '#3FA2E8',
  'En espera del cliente': '#38BDF8',
  Resuelto: '#16A34A',
  Cerrado: '#1E293B'
};

const CATEGORY_COLORS = ['#1565C0', '#F37021', '#3FA2E8', '#0B2A5B', '#F59E0B', '#16A34A', '#64748B'];

// Formateador de números colombiano (separador de miles con punto)
const formatNumberCo = (val: number | string) => {
  const num = typeof val === 'string' ? parseFloat(val) : val;
  if (isNaN(num)) return String(val);
  return new Intl.NumberFormat('es-CO').format(num);
};

// Tooltip estilizado compatible con tema claro y tema oscuro (alta legibilidad)
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const displayTitle = payload[0]?.payload?.fullDate || label;
    return (
      <div className="bg-white dark:bg-[#0E2A52] border border-slate-200 dark:border-[#1E3F73] rounded-xl p-2.5 shadow-xl text-xs select-none">
        {displayTitle && (
          <p className="font-bold text-slate-800 dark:text-[#E8EEF9] mb-1.5 pb-1 border-b border-slate-100 dark:border-[#1E3F73]/50">
            {displayTitle}
          </p>
        )}
        <div className="space-y-1">
          {payload.map((entry: any, index: number) => (
            <div key={`tooltip-item-${index}`} className="flex items-center justify-between gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-slate-600 dark:text-[#94A9CC]">
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0 border border-black/10 dark:border-white/20"
                  style={{ backgroundColor: entry.color || entry.fill }}
                />
                <span>{entry.name}:</span>
              </span>
              <span className="font-mono font-bold text-slate-900 dark:text-[#E8EEF9]">
                {formatNumberCo(entry.value)}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

// Estado vacío reusable
const EmptyState: React.FC = () => (
  <div className="h-64 flex flex-col items-center justify-center text-slate-400 dark:text-[#94A9CC] text-xs italic">
    <span className="material-symbols-outlined text-3xl mb-1 text-slate-300 dark:text-slate-600">bar_chart</span>
    <span>Sin datos en el periodo</span>
  </div>
);

export const MetricsCharts: React.FC<MetricsChartsProps> = ({ tickets }) => {
  // 1. DATA: Tickets creados vs resueltos por día (últimos 30 días)
  const lineChartData = useMemo(() => {
    if (!tickets || tickets.length === 0) return [];

    let maxTimestamp = Date.now();
    tickets.forEach((t) => {
      if (t.createdAtIso) {
        const time = new Date(t.createdAtIso).getTime();
        if (!isNaN(time) && time > maxTimestamp) maxTimestamp = time;
      }
    });

    const endDate = new Date(maxTimestamp);
    const dayMap = new Map<string, { date: string; fullDate: string; creados: number; resueltos: number }>();

    // Generar 30 días en orden cronológico
    for (let i = 29; i >= 0; i--) {
      const d = new Date(endDate);
      d.setDate(d.getDate() - i);
      const isoDay = d.toISOString().slice(0, 10);
      const dayLabel = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
      const fullDate = `${dayLabel}/${d.getFullYear()}`;
      dayMap.set(isoDay, { date: dayLabel, fullDate, creados: 0, resueltos: 0 });
    }

    tickets.forEach((t) => {
      // Creados
      if (t.createdAtIso) {
        const createdDay = t.createdAtIso.slice(0, 10);
        if (dayMap.has(createdDay)) {
          dayMap.get(createdDay)!.creados += 1;
        }
      }

      // Resueltos: buscar en resolvedAtIso o en historial o status
      let resolvedIso: string | undefined = t.resolvedAtIso;
      if (!resolvedIso && t.history) {
        const resolveEvent = t.history.find(
          (h) =>
            h.action.toLowerCase().includes('resuelto') ||
            h.detail.toLowerCase().includes('resuelto') ||
            h.action.toLowerCase().includes('cerrado')
        );
        if (resolveEvent?.createdAtIso) {
          resolvedIso = resolveEvent.createdAtIso;
        }
      }

      if (!resolvedIso && (t.status === 'Resuelto' || t.status === 'Cerrado')) {
        resolvedIso = t.createdAtIso;
      }

      if (resolvedIso) {
        const resolvedDay = resolvedIso.slice(0, 10);
        if (dayMap.has(resolvedDay)) {
          dayMap.get(resolvedDay)!.resueltos += 1;
        }
      }
    });

    return Array.from(dayMap.values());
  }, [tickets]);

  // 2. DATA: Tickets por estado agrupados por severidad / prioridad (barras apiladas)
  const stackedBarData = useMemo(() => {
    if (!tickets || tickets.length === 0) return [];
    const priorities: Array<'Crítica' | 'Alta' | 'Media' | 'Baja'> = ['Crítica', 'Alta', 'Media', 'Baja'];

    return priorities.map((prioridad) => {
      const ticketsInPriority = tickets.filter((t) => t.priority === prioridad);
      return {
        prioridad,
        Nuevo: ticketsInPriority.filter((t) => t.status === 'Nuevo').length,
        Asignado: ticketsInPriority.filter((t) => t.status === 'Asignado').length,
        'En progreso': ticketsInPriority.filter((t) => t.status === 'En progreso').length,
        'En espera del cliente': ticketsInPriority.filter((t) => t.status === 'En espera del cliente').length,
        Resuelto: ticketsInPriority.filter((t) => t.status === 'Resuelto').length,
        Cerrado: ticketsInPriority.filter((t) => t.status === 'Cerrado').length
      };
    });
  }, [tickets]);

  // 3. DATA: Tickets por categoría (Dona PieChart)
  const categoryData = useMemo(() => {
    if (!tickets || tickets.length === 0) return [];
    const counts: Record<string, number> = {};
    tickets.forEach((t) => {
      const cat = t.category || 'Sin categoría';
      counts[cat] = (counts[cat] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [tickets]);

  // 4. DATA: Tickets por empresa cliente (Barras horizontales)
  const companyData = useMemo(() => {
    if (!tickets || tickets.length === 0) return [];
    const counts: Record<string, number> = {};
    tickets.forEach((t) => {
      const comp = t.company || 'Sin empresa';
      counts[comp] = (counts[comp] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([company, count]) => ({ company, count }))
      .sort((a, b) => b.count - a.count);
  }, [tickets]);

  // 5. DATA: Mapa de calor de horas y días de la semana (Hora en America/Bogota)
  const heatmapData = useMemo(() => {
    const days = [
      { full: 'Lunes', short: 'Lun' },
      { full: 'Martes', short: 'Mar' },
      { full: 'Miércoles', short: 'Mié' },
      { full: 'Jueves', short: 'Jue' },
      { full: 'Viernes', short: 'Vie' },
      { full: 'Sábado', short: 'Sáb' },
      { full: 'Domingo', short: 'Dom' }
    ];
    const hours = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18];

    // Matriz [7 días][11 horas]
    const matrix: number[][] = Array.from({ length: 7 }, () => Array(hours.length).fill(0));
    let maxVal = 0;

    const dayNameMap: Record<string, number> = {
      Mon: 0,
      Tue: 1,
      Wed: 2,
      Thu: 3,
      Fri: 4,
      Sat: 5,
      Sun: 6
    };

    tickets.forEach((t) => {
      if (!t.createdAtIso) return;
      const d = new Date(t.createdAtIso);
      if (isNaN(d.getTime())) return;

      const dayStr = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/Bogota',
        weekday: 'short'
      }).format(d);

      const hourStr = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/Bogota',
        hour: 'numeric',
        hour12: false
      }).format(d);

      const dayIdx = dayNameMap[dayStr];
      const hourNum = parseInt(hourStr, 10) % 24;

      if (dayIdx !== undefined) {
        const hourIdx = hours.indexOf(hourNum);
        if (hourIdx !== -1) {
          matrix[dayIdx][hourIdx] += 1;
          if (matrix[dayIdx][hourIdx] > maxVal) {
            maxVal = matrix[dayIdx][hourIdx];
          }
        }
      }
    });

    return { days, hours, matrix, maxVal };
  }, [tickets]);

  // 6. DATA: Carga por agente (Tabla)
  const agentWorkload = useMemo(() => {
    if (!tickets || tickets.length === 0) return [];
    const agentMap = new Map<
      string,
      {
        name: string;
        avatar: string;
        role: string;
        email: string;
        asignados: number;
        resueltos: number;
      }
    >();

    const defaultAgents = [
      {
        name: 'Carlos M. Restrepo',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
        role: 'Supervisor de soporte y SLA',
        email: 'carlos.restrepo@sfs.com.co'
      },
      {
        name: 'Andrés Moreno',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
        role: 'Especialista L2 de soporte',
        email: 'andres.moreno@sfs.com.co'
      },
      {
        name: 'Laura Yepes',
        avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=80',
        role: 'Especialista DBA y soporte',
        email: 'laura.yepes@sfs.com.co'
      },
      {
        name: 'Felipe Castaño',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80',
        role: 'Consultor funcional ERP y BI',
        email: 'felipe.castano@sfs.com.co'
      }
    ];

    defaultAgents.forEach((a) => {
      agentMap.set(a.name, { ...a, asignados: 0, resueltos: 0 });
    });

    tickets.forEach((t) => {
      const agentName = t.assignedAgent?.name;
      if (agentName) {
        if (!agentMap.has(agentName)) {
          agentMap.set(agentName, {
            name: agentName,
            avatar: t.assignedAgent?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
            role: t.assignedAgent?.role || 'Agente de soporte',
            email: t.assignedAgent?.email || `${agentName.toLowerCase().replace(/\s+/g, '.')}@sfs.com.co`,
            asignados: 0,
            resueltos: 0
          });
        }
        const record = agentMap.get(agentName)!;
        record.asignados += 1;
        if (t.status === 'Resuelto' || t.status === 'Cerrado') {
          record.resueltos += 1;
        }
      }
    });

    return Array.from(agentMap.values()).sort((a, b) => b.asignados - a.asignados);
  }, [tickets]);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* GRÁFICA 1: Tickets creados vs resueltos por día (últimos 30 días) */}
        <div className="bg-white dark:bg-[#0E2A52] rounded-2xl border border-slate-200 dark:border-[#1E3F73] shadow-2xs p-4 sm:p-5 flex flex-col justify-between transition-colors">
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-[#94A9CC]">
                  Tickets creados vs. resueltos por día
                </h3>
                <p className="text-[11px] text-slate-400 dark:text-[#94A9CC]/70 mt-0.5">
                  Evolución de flujo de tickets en los últimos 30 días
                </p>
              </div>
              <span className="text-xs font-bold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2.5 py-0.5 rounded-full border border-blue-200 dark:border-blue-800/60 flex-shrink-0">
                30 días
              </span>
            </div>

            {lineChartData.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={lineChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#94a3b8" opacity={0.2} />
                    <XAxis
                      dataKey="date"
                      tick={{ fill: '#94a3b8', fontSize: 10 }}
                      tickLine={false}
                      axisLine={{ stroke: '#cbd5e1' }}
                      interval="preserveStartEnd"
                    />
                    <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                    <Line
                      type="monotone"
                      name="Creados"
                      dataKey="creados"
                      stroke={BRAND_COLORS.azulRey}
                      strokeWidth={2.5}
                      dot={{ r: 2, fill: BRAND_COLORS.azulRey }}
                      activeDot={{ r: 4 }}
                    />
                    <Line
                      type="monotone"
                      name="Resueltos"
                      dataKey="resueltos"
                      stroke={STATUS_COLORS.Resuelto}
                      strokeWidth={2.5}
                      dot={{ r: 2, fill: STATUS_COLORS.Resuelto }}
                      activeDot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        {/* GRÁFICA 2: Tickets por estado (Barras apiladas con los 6 estados) */}
        <div className="bg-white dark:bg-[#0E2A52] rounded-2xl border border-slate-200 dark:border-[#1E3F73] shadow-2xs p-4 sm:p-5 flex flex-col justify-between transition-colors">
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-[#94A9CC]">
                  Tickets por estado
                </h3>
                <p className="text-[11px] text-slate-400 dark:text-[#94A9CC]/70 mt-0.5">
                  Distribución en barras apiladas por nivel de severidad
                </p>
              </div>
            </div>

            {stackedBarData.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stackedBarData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#94a3b8" opacity={0.2} />
                    <XAxis dataKey="prioridad" tick={{ fill: '#94a3b8', fontSize: 11 }} tickLine={false} axisLine={{ stroke: '#cbd5e1' }} />
                    <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 10, paddingTop: 8 }} />
                    <Bar dataKey="Nuevo" stackId="a" fill={STATUS_COLORS.Nuevo} />
                    <Bar dataKey="Asignado" stackId="a" fill={STATUS_COLORS.Asignado} />
                    <Bar dataKey="En progreso" stackId="a" fill={STATUS_COLORS['En progreso']} />
                    <Bar dataKey="En espera del cliente" stackId="a" fill={STATUS_COLORS['En espera del cliente']} />
                    <Bar dataKey="Resuelto" stackId="a" fill={STATUS_COLORS.Resuelto} />
                    <Bar dataKey="Cerrado" stackId="a" fill={STATUS_COLORS.Cerrado} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        {/* GRÁFICA 3: Por categoría - dona (PieChart) ocupando ancho completo en lg */}
        <div className="bg-white dark:bg-[#0E2A52] rounded-2xl border border-slate-200 dark:border-[#1E3F73] shadow-2xs p-4 sm:p-5 lg:col-span-2 transition-colors">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-[#94A9CC]">
                Distribución por categoría del caso
              </h3>
              <p className="text-[11px] text-slate-400 dark:text-[#94A9CC]/70 mt-0.5">
                Proporción de solicitudes según tipo de problema reportado
              </p>
            </div>
          </div>

          {categoryData.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip content={<CustomTooltip />} />
                    <Pie
                      data={categoryData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={3}
                      stroke="currentColor"
                      className="stroke-white dark:stroke-[#0E2A52]"
                      strokeWidth={2}
                    >
                      {categoryData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Leyenda y Desglose Detallado */}
              <div className="space-y-2 pr-1 sm:pr-2">
                {categoryData.map((cat, idx) => {
                  const totalTickets = tickets.length || 1;
                  const pct = ((cat.value / totalTickets) * 100).toFixed(1);
                  const color = CATEGORY_COLORS[idx % CATEGORY_COLORS.length];
                  return (
                    <div
                      key={cat.name}
                      className="flex items-center justify-between text-xs py-1 border-b border-slate-100 dark:border-[#1E3F73]/50 last:border-none"
                    >
                      <div className="flex items-center gap-2 min-w-0 pr-2">
                        <span
                          className="w-3 h-3 rounded-md flex-shrink-0 border border-black/10 dark:border-white/20"
                          style={{ backgroundColor: color }}
                        />
                        <span className="font-medium text-slate-700 dark:text-[#E8EEF9] truncate">{cat.name}</span>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 font-mono">
                        <span className="font-bold text-slate-900 dark:text-[#E8EEF9]">{formatNumberCo(cat.value)}</span>
                        <span className="text-slate-400 dark:text-[#94A9CC] text-[11px]">({pct}%)</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* GRÁFICA 4: Por empresa cliente - barras horizontales */}
        <div className="bg-white dark:bg-[#0E2A52] rounded-2xl border border-slate-200 dark:border-[#1E3F73] shadow-2xs p-4 sm:p-5 flex flex-col justify-between transition-colors">
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-[#94A9CC]">
                  Tickets por empresa cliente
                </h3>
                <p className="text-[11px] text-slate-400 dark:text-[#94A9CC]/70 mt-0.5">
                  Volumen total de casos registrados por cuenta corporativa
                </p>
              </div>
            </div>

            {companyData.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={companyData}
                    layout="vertical"
                    margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#94a3b8" opacity={0.2} />
                    <XAxis
                      type="number"
                      tick={{ fill: '#94a3b8', fontSize: 11 }}
                      tickLine={false}
                      axisLine={{ stroke: '#cbd5e1' }}
                      allowDecimals={false}
                    />
                    <YAxis
                      dataKey="company"
                      type="category"
                      tick={{ fill: '#94a3b8', fontSize: 10 }}
                      tickLine={false}
                      axisLine={false}
                      width={105}
                      tickFormatter={(val) => (val && val.length > 14 ? `${val.slice(0, 13)}…` : val)}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar
                      dataKey="count"
                      name="Tickets"
                      fill={BRAND_COLORS.azulRey}
                      radius={[0, 6, 6, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        {/* GRÁFICA 6: Carga por agente (Tabla analítica responsive sin scroll) */}
        <div className="bg-white dark:bg-[#0E2A52] rounded-2xl border border-slate-200 dark:border-[#1E3F73] shadow-2xs p-4 sm:p-5 flex flex-col justify-between transition-colors">
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-[#94A9CC]">
                  Carga y rendimiento por agente
                </h3>
                <p className="text-[11px] text-slate-400 dark:text-[#94A9CC]/70 mt-0.5">
                  Tickets asignados, resoluciones y disponibilidad
                </p>
              </div>
            </div>

            {agentWorkload.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="w-full">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-[#1E3F73] text-[10px] sm:text-[11px] font-bold text-slate-400 dark:text-[#94A9CC]/70 uppercase tracking-wider">
                      <th className="pb-2">Agente</th>
                      <th className="pb-2 text-center">Asignados</th>
                      <th className="pb-2 text-center">Resueltos</th>
                      <th className="pb-2 text-right">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-[#1E3F73]/50">
                    {agentWorkload.map((agent) => {
                      const isHighLoad = agent.asignados >= 5;
                      const isNormalLoad = agent.asignados >= 2 && agent.asignados < 5;
                      return (
                        <tr key={agent.name} className="hover:bg-slate-50 dark:hover:bg-[#081B3A]/40 transition-colors">
                          <td className="py-2 sm:py-2.5 pr-1 sm:pr-2">
                            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                              <img
                                src={agent.avatar}
                                alt={agent.name}
                                className="w-6 h-6 sm:w-7 sm:h-7 rounded-full object-cover flex-shrink-0"
                              />
                              <div className="min-w-0">
                                <span className="font-bold text-slate-900 dark:text-[#E8EEF9] block truncate text-[11px] sm:text-xs">
                                  {agent.name}
                                </span>
                                <span className="text-[10px] text-slate-400 hidden sm:block truncate">
                                  {agent.role}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="py-2 sm:py-2.5 px-1 sm:px-2 text-center font-mono font-bold text-slate-900 dark:text-[#E8EEF9]">
                            {formatNumberCo(agent.asignados)}
                          </td>
                          <td className="py-2 sm:py-2.5 px-1 sm:px-2 text-center font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            {formatNumberCo(agent.resueltos)}
                          </td>
                          <td className="py-2 sm:py-2.5 pl-1 sm:pl-2 text-right">
                            <span
                              className={`px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold whitespace-nowrap inline-block ${
                                isHighLoad
                                  ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60'
                                  : isNormalLoad
                                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60'
                                  : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60'
                              }`}
                            >
                              {isHighLoad ? 'Carga alta' : isNormalLoad ? 'Carga normal' : 'Disponible'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* GRÁFICA 5: Mapa de calor de horas y días (Ancho completo en lg, responsive sin scroll horizontal en móvil) */}
        <div className="bg-white dark:bg-[#0E2A52] rounded-2xl border border-slate-200 dark:border-[#1E3F73] shadow-2xs p-3.5 sm:p-5 lg:col-span-2 transition-colors">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 sm:mb-4">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-[#94A9CC]">
                Mapa de calor: Concentración por hora y día
              </h3>
              <p className="text-[11px] text-slate-400 dark:text-[#94A9CC]/70 mt-0.5">
                Volumen de creación de incidentes cruzando día de la semana y hora hábil (Zona Bogotá UTC-5)
              </p>
            </div>
            {/* Escala de colores */}
            <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-slate-500 dark:text-[#94A9CC] self-end sm:self-center">
              <span>Menos</span>
              <span className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded bg-slate-100 dark:bg-[#081B3A] border border-slate-200 dark:border-[#1E3F73]" />
              <span className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded bg-[#BAE6FD] dark:bg-[#0c3666]" />
              <span className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded bg-[#3FA2E8] dark:bg-[#1565C0]" />
              <span className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded bg-[#F37021]" />
              <span>Más</span>
            </div>
          </div>

          <div className="w-full">
            {/* Header de Horas */}
            <div className="grid grid-cols-[36px_repeat(11,minmax(0,1fr))] sm:grid-cols-[75px_repeat(11,minmax(0,1fr))] gap-1 sm:gap-1.5 mb-1 sm:mb-1.5 text-center text-[10px] sm:text-[11px] font-bold text-slate-400 dark:text-[#94A9CC]/70">
              <div className="text-left pl-0.5">Día</div>
              {heatmapData.hours.map((h) => (
                <div key={h} className="truncate">
                  <span className="hidden sm:inline">{h}:00</span>
                  <span className="sm:hidden">{h}h</span>
                </div>
              ))}
            </div>

            {/* Filas por Día de la Semana */}
            <div className="space-y-1 sm:space-y-1.5">
              {heatmapData.days.map((day, dayIdx) => (
                <div
                  key={day.full}
                  className="grid grid-cols-[36px_repeat(11,minmax(0,1fr))] sm:grid-cols-[75px_repeat(11,minmax(0,1fr))] gap-1 sm:gap-1.5 items-center"
                >
                  <span className="text-[11px] sm:text-xs font-bold text-slate-700 dark:text-[#E8EEF9] truncate pl-0.5">
                    <span className="hidden sm:inline">{day.full}</span>
                    <span className="sm:hidden">{day.short}</span>
                  </span>
                  {heatmapData.hours.map((hour, hourIdx) => {
                    const count = heatmapData.matrix[dayIdx][hourIdx];

                    let cellClass =
                      'bg-slate-100 dark:bg-[#081B3A] text-slate-400 dark:text-slate-600 border border-slate-200/50 dark:border-[#1E3F73]/50';
                    if (count === 1) {
                      cellClass =
                        'bg-[#BAE6FD] dark:bg-[#0c3666] text-blue-900 dark:text-blue-100 font-semibold border border-blue-200/50 dark:border-blue-900/50';
                    } else if (count === 2) {
                      cellClass =
                        'bg-[#3FA2E8] dark:bg-[#1565C0] text-white font-bold shadow-2xs';
                    } else if (count >= 3) {
                      cellClass = 'bg-[#F37021] text-white font-bold shadow-xs';
                    }

                    return (
                      <div
                        key={`${dayIdx}-${hour}`}
                        title={`${day.full} ${hour}:00 - ${count} ${count === 1 ? 'ticket' : 'tickets'}`}
                        className={`h-6 sm:h-7.5 rounded sm:rounded-lg flex items-center justify-center text-[10px] sm:text-xs transition-all cursor-default select-none ${cellClass} hover:scale-105`}
                      >
                        {count > 0 ? count : ''}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

