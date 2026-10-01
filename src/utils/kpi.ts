/**
 * Cálculo dinámico de métricas y KPIs a partir de los tickets reales (Requirement 8).
 * Elimina cualquier valor estático o prefijado.
 */

import { Ticket, KPIStats } from '../types';
import { getBogotaDateParts } from '../../lib/sla/index';

export function calcularKPIs(tickets: Ticket[], refDate = new Date()): KPIStats {
  const hoyBogota = getBogotaDateParts(refDate);

  // 1. Tickets creados hoy en horario Bogotá
  const ticketsHoy = tickets.filter(t => {
    if (!t.createdAtIso) return false;
    const parts = getBogotaDateParts(new Date(t.createdAtIso));
    return parts.year === hoyBogota.year && parts.month === hoyBogota.month && parts.day === hoyBogota.day;
  });

  // Tickets creados el día anterior en Bogotá
  const ayerDate = new Date(refDate.getTime() - 24 * 60 * 60 * 1000);
  const ayerBogota = getBogotaDateParts(ayerDate);
  const ticketsAyer = tickets.filter(t => {
    if (!t.createdAtIso) return false;
    const parts = getBogotaDateParts(new Date(t.createdAtIso));
    return parts.year === ayerBogota.year && parts.month === ayerBogota.month && parts.day === ayerBogota.day;
  });

  const delta = ticketsHoy.length - ticketsAyer.length;
  const deltaText = delta >= 0 ? `+${delta} respecto al día anterior` : `${delta} respecto al día anterior`;

  // 2. Cumplimiento SLA (%): tickets no vencidos / total
  const total = tickets.length;
  const vencidos = tickets.filter(t =>
    t.isBreached || (t.slaMinutesRemaining <= 0 && t.status !== 'Resuelto' && t.status !== 'Cerrado')
  ).length;

  const compliance = total > 0 ? Number((((total - vencidos) / total) * 100).toFixed(1)) : 100;

  // 3. Tiempo medio de primera respuesta
  let totalResponseTimeMinutes = 0;
  let responseCount = 0;

  for (const t of tickets) {
    if (t.messages && t.messages.length > 1) {
      const firstClient = t.messages.find(m => m.senderRole === 'cliente');
      const firstSupport = t.messages.find(m => m.senderRole === 'soporte' && !m.isInternal);
      if (firstClient && firstSupport && firstSupport.timestamp > firstClient.timestamp) {
        const diffMinutes = (firstSupport.timestamp - firstClient.timestamp) / 60000;
        totalResponseTimeMinutes += diffMinutes;
        responseCount++;
      }
    }
  }

  const avgMinutes = responseCount > 0 ? Math.round(totalResponseTimeMinutes / responseCount) : null;
  const firstResponseTime = avgMinutes === null
    ? 'Sin datos'
    : avgMinutes >= 60
      ? `${Math.floor(avgMinutes / 60)} h ${avgMinutes % 60} min`
      : `${avgMinutes} min`;

  // 4. Críticos en riesgo: prioridad Crítica activa con SLA < 60 min o ya vencidos
  const criticalAtRisk = tickets.filter(t =>
    t.priority === 'Crítica' &&
    t.status !== 'Resuelto' &&
    t.status !== 'Cerrado' &&
    (t.isBreached || t.slaMinutesRemaining < 60)
  ).length;

  return {
    openToday: ticketsHoy.length,
    openTodayDelta: deltaText,
    firstResponseTime,
    firstResponseTarget: 'Meta: <30 min',
    slaCompliancePercent: compliance,
    criticalAtRisk,
    criticalAtRiskDetail: criticalAtRisk > 0 ? `< 1 h SLA (${criticalAtRisk} tickets)` : 'Bajo control'
  };
}
