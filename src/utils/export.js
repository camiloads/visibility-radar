import * as XLSX from 'xlsx';
import { fmtPct, fmtNum, fmtInt, fmtDelta } from './analysis.js';

function pct(v) { return v !== null && v !== undefined ? v / 100 : null; }

export function downloadReport({ operativeAlerts, brandHealth, allWeeks, lastWeekDate }) {
  const wb = XLSX.utils.book_new();

  // ── 1. ALERTAS OPERATIVAS ────────────────────────────────────────────────
  const opRows = [];
  opRows.push([
    'Tipo de Alerta', 'Severidad', 'Campaña', 'KPI Afectado',
    'Valor Última Semana', 'Media 8 Semanas', 'Media 4 Semanas Previas',
    'Δ vs Media 8S', 'Δ vs Media 4S', 'Umbral'
  ]);

  operativeAlerts.forEach(cd => {
    cd.alerts.forEach(alert => {
      opRows.push([
        alert.type === 'IS_DROP' ? 'Caída Cuota Imp. Búsqueda' : 'Caída Cuota Imp. Abs. Top',
        alert.severity === 'critical' ? 'CRÍTICO' : 'ALERTA',
        cd.campana,
        alert.label,
        fmtPct(alert.lastVal),
        fmtPct(alert.avg8),
        fmtPct(alert.avg4),
        fmtDelta(alert.delta8),
        fmtDelta(alert.delta4),
        alert.type === 'IS_DROP' ? '-10pp' : '-15pp',
      ]);
    });
  });

  if (opRows.length === 1) {
    opRows.push(['Sin alertas operativas esta semana', '', '', '', '', '', '', '', '', '']);
  }

  const wsOp = XLSX.utils.aoa_to_sheet(opRows);
  wsOp['!cols'] = [28, 12, 42, 28, 20, 18, 22, 14, 14, 10].map(w => ({ wch: w }));
  XLSX.utils.book_append_sheet(wb, wsOp, 'Alertas Operativas');

  // ── 2. SALUD ESTRUCTURAL DE MARCA ────────────────────────────────────────
  const bhRows = [];
  bhRows.push([
    'Estado', 'Campaña',
    'Cuota Imp. Búsqueda', 'Estado IS',
    'Cuota Imp. Parte Sup.', 'Estado IS Top',
    'Imp. Perd. Ranking', 'Estado Ranking',
    'Condiciones Fallidas'
  ]);

  brandHealth.forEach(cd => {
    const is    = cd.conditions.find(c => c.kpi === 'is');
    const isTop = cd.conditions.find(c => c.kpi === 'isTop');
    const rank  = cd.conditions.find(c => c.kpi === 'lostRank');

    const statusLabel = cd.status === 'ok' ? '✅ SALUDABLE'
      : cd.status === 'critical'           ? '🔴 CRÍTICO'
      :                                      '⚠️ DÉBIL';

    bhRows.push([
      statusLabel,
      cd.campana,
      is    ? fmtPct(is.value)    : '—',
      is    ? (is.pass    ? 'OK' : `FALLO < ${is.threshold}%`)    : '—',
      isTop ? fmtPct(isTop.value) : '—',
      isTop ? (isTop.pass ? 'OK' : `FALLO < ${isTop.threshold}%`) : '—',
      rank  ? fmtPct(rank.value)  : '—',
      rank  ? (rank.pass  ? 'OK' : `FALLO > ${rank.threshold}%`)  : '—',
      cd.failed.map(f => f.label).join(', ') || 'Ninguna',
    ]);
  });

  const wsBH = XLSX.utils.aoa_to_sheet(bhRows);
  wsBH['!cols'] = [16, 42, 22, 18, 22, 18, 22, 18, 36].map(w => ({ wch: w }));
  XLSX.utils.book_append_sheet(wb, wsBH, 'Salud Estructural Marca');

  // ── 3. RESUMEN EJECUTIVO ─────────────────────────────────────────────────
  const lastWeekStr = lastWeekDate
    ? `${lastWeekDate.getDate().toString().padStart(2,'0')}/${(lastWeekDate.getMonth()+1).toString().padStart(2,'0')}/${lastWeekDate.getFullYear()}`
    : '—';

  const summaryRows = [
    ['VISIBILITY RADAR — REPORTE SEMANAL SEM'],
    [''],
    ['Generado el:', new Date().toLocaleString('es-ES')],
    ['Última semana analizada:', lastWeekStr],
    ['Total campañas:', brandHealth.length],
    [''],
    ['RESUMEN DE ALERTAS OPERATIVAS'],
    ['Total alertas:', operativeAlerts.length],
    ['Alertas críticas:', operativeAlerts.filter(a => a.maxSeverity === 'critical').length],
    ['Alertas de aviso:', operativeAlerts.filter(a => a.maxSeverity === 'warning').length],
    [''],
    ['RESUMEN SALUD ESTRUCTURAL'],
    ['Campañas saludables:', brandHealth.filter(b => b.status === 'ok').length],
    ['Campañas con branding débil:', brandHealth.filter(b => b.isWeakBrand).length],
    ['Campañas en estado crítico:', brandHealth.filter(b => b.status === 'critical').length],
    [''],
    ['DETALLE ALERTAS OPERATIVAS POR TIPO'],
    ['Caída Cuota Imp. Búsqueda (> -10pp):', operativeAlerts.filter(a => a.alerts.some(al => al.type === 'IS_DROP')).length],
    ['Caída Cuota Imp. Abs. Top (> -15pp):', operativeAlerts.filter(a => a.alerts.some(al => al.type === 'IS_ABS_TOP_DROP')).length],
  ];

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
  wsSummary['!cols'] = [38, 24].map(w => ({ wch: w }));
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Resumen Ejecutivo');

  // Download
  const date = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `visibility-radar-reporte-${date}.xlsx`);
}
