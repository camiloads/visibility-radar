// ─── Parsing helpers ──────────────────────────────────────────────────────────

export function parsePercent(str) {
  if (!str || str === '' || str === '-') return null;
  return parseFloat(str.replace('%', '').replace(',', '.').trim());
}

export function parseNumber(str) {
  if (!str || str === '' || str === '-') return null;
  return parseFloat(str.replace(/\./g, '').replace(',', '.').trim());
}

export function parseDate(str) {
  if (!str) return null;
  // Format: D/MM/YYYY or DD/MM/YYYY
  const parts = str.trim().split('/');
  if (parts.length !== 3) return null;
  const [d, m, y] = parts;
  return new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
}

export function formatDate(date) {
  if (!date) return '';
  const d = date.getDate().toString().padStart(2, '0');
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const y = date.getFullYear();
  return `${d}/${m}/${y}`;
}

export function formatWeekLabel(date) {
  if (!date) return '';
  const d = date.getDate().toString().padStart(2, '0');
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  return `${d} ${months[date.getMonth()]}`;
}

// ─── Column name mapping ──────────────────────────────────────────────────────

export const COL = {
  semana:          'Semana',
  campana:         'Campaña',
  impresiones:     'Impr.',
  moneda:          'Código de moneda',
  coste:           'Coste',
  is:              'Cuota de impr. de búsqueda',
  isTop:           'Cuota impr. de parte sup. de búsqueda',
  isAbsTop:        'Cuota impr. parte sup. absoluta de Búsqueda',
  lostBudget:      '% impr. perdidas de búsq. (presup.)',
  lostTopBudget:   'Cuota impr. perdidas de parte sup. de búsqueda (presupuesto)',
  lostAbsTopBudget:'Cuota impr. perdidas de parte sup. abs. de búsqueda (presupuesto)',
  lostRank:        'Cuota impr. perd. de búsq. (ranking)',
  lostTopRank:     'Cuota impr. perdidas de parte sup. de búsqueda (ranking)',
  lostAbsTopRank:  'Cuota impr. perdidas de parte sup. abs. de búsqueda (ranking)',
};

export const KPI_LABELS = {
  is:         'Cuota Imp. Búsqueda',
  isTop:      'Cuota Imp. Parte Sup.',
  isAbsTop:   'Cuota Imp. Abs. Top',
  lostRank:   'Imp. Perd. (Ranking)',
  coste:      'Coste',
  impresiones:'Impresiones',
};

// ─── Parse raw rows from XLSX/CSV ─────────────────────────────────────────────

export function parseRows(rawRows) {
  return rawRows
    .filter(r => r[COL.campana] && r[COL.semana])
    .map(r => ({
      semana:           r[COL.semana]?.toString().trim(),
      semanaDate:       parseDate(r[COL.semana]?.toString().trim()),
      campana:          r[COL.campana]?.toString().trim(),
      impresiones:      parseNumber(r[COL.impresiones]?.toString()),
      coste:            parseNumber(r[COL.coste]?.toString()),
      moneda:           r[COL.moneda]?.toString().trim() || 'EUR',
      is:               parsePercent(r[COL.is]?.toString()),
      isTop:            parsePercent(r[COL.isTop]?.toString()),
      isAbsTop:         parsePercent(r[COL.isAbsTop]?.toString()),
      lostBudget:       parsePercent(r[COL.lostBudget]?.toString()),
      lostTopBudget:    parsePercent(r[COL.lostTopBudget]?.toString()),
      lostAbsTopBudget: parsePercent(r[COL.lostAbsTopBudget]?.toString()),
      lostRank:         parsePercent(r[COL.lostRank]?.toString()),
      lostTopRank:      parsePercent(r[COL.lostTopRank]?.toString()),
      lostAbsTopRank:   parsePercent(r[COL.lostAbsTopRank]?.toString()),
    }))
    .filter(r => r.semanaDate !== null)
    .sort((a, b) => a.semanaDate - b.semanaDate);
}

// ─── Compute averages for a set of rows ───────────────────────────────────────

function avg(rows, field) {
  const vals = rows.map(r => r[field]).filter(v => v !== null && v !== undefined);
  if (!vals.length) return null;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

// ─── Main analysis function ───────────────────────────────────────────────────

export function analyzeData(rows) {
  // Get sorted unique weeks
  const allDates = [...new Set(rows.map(r => r.semanaDate.getTime()))].sort((a, b) => a - b);
  const allWeeks = allDates.map(t => new Date(t));
  const lastWeekDate = allWeeks[allWeeks.length - 1];

  // Group by campaign
  const campaigns = [...new Set(rows.map(r => r.campana))];

  const kpiFields = ['is', 'isTop', 'isAbsTop', 'lostRank', 'coste', 'impresiones',
                     'lostBudget', 'lostTopBudget', 'lostAbsTopBudget', 'lostTopRank', 'lostAbsTopRank'];

  const campaignData = campaigns.map(campana => {
    const campRows = rows.filter(r => r.campana === campana)
      .sort((a, b) => a.semanaDate - b.semanaDate);

    const last8 = campRows.slice(-8);
    const prev4 = campRows.slice(-5, -1); // 4 weeks before last
    const lastRow = campRows[campRows.length - 1];

    const stats = {};
    kpiFields.forEach(field => {
      const avg8  = avg(last8, field);
      const avg4  = avg(prev4, field);
      const lastVal = lastRow ? lastRow[field] : null;
      const delta8  = (lastVal !== null && avg8  !== null) ? lastVal - avg8  : null;
      const delta4  = (lastVal !== null && avg4  !== null) ? lastVal - avg4  : null;
      stats[field] = { avg8, avg4, lastVal, delta8, delta4 };
    });

    return {
      campana,
      lastWeek:   lastRow?.semana,
      lastDate:   lastRow?.semanaDate,
      stats,
      history:    campRows,
      lastRow,
    };
  });

  // ── CONTROL SEMANAL OPERATIVO ─────────────────────────────────────────────
  const operativeAlerts = [];

  campaignData.forEach(cd => {
    const alerts = [];
    const { stats } = cd;

    // Alert 1: IS drops > 10pp vs avg8
    if (stats.is.delta8 !== null && stats.is.delta8 <= -10) {
      alerts.push({
        type:      'IS_DROP',
        kpi:       'is',
        label:     'Cuota Imp. Búsqueda',
        threshold: -10,
        delta8:    stats.is.delta8,
        delta4:    stats.is.delta4,
        lastVal:   stats.is.lastVal,
        avg8:      stats.is.avg8,
        avg4:      stats.is.avg4,
        severity:  stats.is.delta8 <= -20 ? 'critical' : 'warning',
      });
    }

    // Alert 2: IS Abs Top drops > 15pp vs avg8
    if (stats.isAbsTop.delta8 !== null && stats.isAbsTop.delta8 <= -15) {
      alerts.push({
        type:      'IS_ABS_TOP_DROP',
        kpi:       'isAbsTop',
        label:     'Cuota Imp. Abs. Top',
        threshold: -15,
        delta8:    stats.isAbsTop.delta8,
        delta4:    stats.isAbsTop.delta4,
        lastVal:   stats.isAbsTop.lastVal,
        avg8:      stats.isAbsTop.avg8,
        avg4:      stats.isAbsTop.avg4,
        severity:  stats.isAbsTop.delta8 <= -25 ? 'critical' : 'warning',
      });
    }

    if (alerts.length > 0) {
      operativeAlerts.push({
        ...cd,
        alerts,
        maxSeverity: alerts.some(a => a.severity === 'critical') ? 'critical' : 'warning',
      });
    }
  });

  // Sort by severity then by worst delta
  operativeAlerts.sort((a, b) => {
    if (a.maxSeverity !== b.maxSeverity) {
      return a.maxSeverity === 'critical' ? -1 : 1;
    }
    const aWorst = Math.min(...a.alerts.map(al => al.delta8));
    const bWorst = Math.min(...b.alerts.map(al => al.delta8));
    return aWorst - bWorst;
  });

  // ── SALUD ESTRUCTURAL DE MARCA ────────────────────────────────────────────
  const brandHealth = campaignData.map(cd => {
    const { lastRow } = cd;
    if (!lastRow) return null;

    const conditions = [];

    // IS < 85%
    if (lastRow.is !== null) {
      conditions.push({
        kpi:       'is',
        label:     'Cuota Imp. Búsqueda',
        value:     lastRow.is,
        threshold: 85,
        operator:  '<',
        pass:      lastRow.is >= 85,
        severity:  lastRow.is < 70 ? 'critical' : 'warning',
      });
    }

    // IS Top < 60%
    if (lastRow.isTop !== null) {
      conditions.push({
        kpi:       'isTop',
        label:     'Cuota Imp. Parte Sup.',
        value:     lastRow.isTop,
        threshold: 60,
        operator:  '<',
        pass:      lastRow.isTop >= 60,
        severity:  lastRow.isTop < 45 ? 'critical' : 'warning',
      });
    }

    // Lost Rank > 10–15% (using 10 as threshold)
    if (lastRow.lostRank !== null) {
      conditions.push({
        kpi:       'lostRank',
        label:     'Imp. Perd. Ranking',
        value:     lastRow.lostRank,
        threshold: 10,
        operator:  '>',
        pass:      lastRow.lostRank <= 10,
        severity:  lastRow.lostRank > 15 ? 'critical' : 'warning',
      });
    }

    const failed = conditions.filter(c => !c.pass);
    const hasCritical = failed.some(c => c.severity === 'critical');
    const status = failed.length === 0 ? 'ok' : hasCritical ? 'critical' : 'warning';

    return {
      ...cd,
      conditions,
      failed,
      status,
      isWeakBrand: failed.length > 0,
    };
  }).filter(Boolean);

  brandHealth.sort((a, b) => {
    const order = { critical: 0, warning: 1, ok: 2 };
    return (order[a.status] ?? 3) - (order[b.status] ?? 3);
  });

  return {
    allWeeks,
    lastWeekDate,
    campaigns,
    campaignData,
    operativeAlerts,
    brandHealth,
    totalCampaigns: campaigns.length,
    totalAlerts:    operativeAlerts.length,
    weakBrands:     brandHealth.filter(b => b.isWeakBrand).length,
  };
}

// ─── Format helpers ───────────────────────────────────────────────────────────

export function fmtPct(val, decimals = 2) {
  if (val === null || val === undefined) return '—';
  return `${val.toFixed(decimals)}%`;
}

export function fmtNum(val) {
  if (val === null || val === undefined) return '—';
  return val.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function fmtInt(val) {
  if (val === null || val === undefined) return '—';
  return Math.round(val).toLocaleString('es-ES');
}

export function fmtDelta(val, decimals = 2) {
  if (val === null || val === undefined) return '—';
  const sign = val > 0 ? '+' : '';
  return `${sign}${val.toFixed(decimals)}pp`;
}

export function deltaClass(val, inverse = false) {
  if (val === null || val === undefined) return 'delta-neu';
  const positive = inverse ? val < 0 : val > 0;
  const negative = inverse ? val > 0 : val < 0;
  if (positive) return 'delta-pos';
  if (negative) return 'delta-neg';
  return 'delta-neu';
}

// IS-type KPI: higher is better. lostRank: lower is better
export function kpiClass(val, kpi) {
  if (val === null || val === undefined) return 'kpi-neutral';
  if (kpi === 'lostRank' || kpi === 'lostBudget') {
    if (val <= 5)  return 'kpi-good';
    if (val <= 15) return 'kpi-warn';
    return 'kpi-bad';
  }
  if (val >= 85)  return 'kpi-good';
  if (val >= 60)  return 'kpi-warn';
  return 'kpi-bad';
}

export function sortRows(rows, field, dir) {
  return [...rows].sort((a, b) => {
    const av = a[field] ?? a.stats?.[field]?.lastVal ?? 0;
    const bv = b[field] ?? b.stats?.[field]?.lastVal ?? 0;
    return dir === 'asc' ? av - bv : bv - av;
  });
}
