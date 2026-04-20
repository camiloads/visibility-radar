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
  const s = str.trim();
  const mdy = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (mdy) {
    const [_, a, b, y] = mdy;
    const first = parseInt(a), second = parseInt(b);
    if (first <= 12 && second > 12) return new Date(parseInt(y), first - 1, second);
    if (first > 12 && second <= 12) return new Date(parseInt(y), second - 1, first);
    return new Date(parseInt(y), first - 1, second); // ambiguous → M/DD/YYYY
  }
  return null;
}

export function formatDate(date) {
  if (!date) return '';
  const d = date.getDate().toString().padStart(2, '0');
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  return `${d}/${m}/${date.getFullYear()}`;
}

export function formatWeekLabel(date) {
  if (!date) return '';
  const months = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  return `${date.getDate().toString().padStart(2,'0')} ${months[date.getMonth()]}`;
}

// ─── Column mapping ───────────────────────────────────────────────────────────

export const COL = {
  semana:           'Semana',
  campana:          'Campaña',
  impresiones:      'Impr.',
  moneda:           'Código de moneda',
  coste:            'Coste',
  is:               'Cuota de impr. de búsqueda',
  isTop:            'Cuota impr. de parte sup. de búsqueda',
  isAbsTop:         'Cuota impr. parte sup. absoluta de Búsqueda',
  lostBudget:       '% impr. perdidas de búsq. (presup.)',
  lostTopBudget:    'Cuota impr. perdidas de parte sup. de búsqueda (presupuesto)',
  lostAbsTopBudget: 'Cuota impr. perdidas de parte sup. abs. de búsqueda (presupuesto)',
  lostRank:         'Cuota impr. perd. de búsq. (ranking)',
  lostTopRank:      'Cuota impr. perdidas de parte sup. de búsqueda (ranking)',
  lostAbsTopRank:   'Cuota impr. perdidas de parte sup. abs. de búsqueda (ranking)',
};

export const KPI_LABELS = {
  is:          'Cuota Imp. Búsqueda',
  isTop:       'Cuota Imp. Parte Sup.',
  isAbsTop:    'Cuota Imp. Abs. Top',
  lostRank:    'Imp. Perd. (Ranking)',
  coste:       'Coste',
  impresiones: 'Impresiones',
};

// ─── Parse rows ───────────────────────────────────────────────────────────────

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

// ─── Weighted averages ────────────────────────────────────────────────────────

// IS Búsqueda: Σ Impr / Σ(Impr ÷ IS)
function weightedAvgIS(rows) {
  const valid = rows.filter(r =>
    r.impresiones > 0 && r.is !== null && r.is > 0
  );
  if (!valid.length) return null;
  const totalImpr = valid.reduce((s, r) => s + r.impresiones, 0);
  const totalElig = valid.reduce((s, r) => s + (r.impresiones / (r.is / 100)), 0);
  return totalElig > 0 ? (totalImpr / totalElig) * 100 : null;
}

// IS Abs Top: Σ(Impr × IS_AT) / Σ Impr  — Método B validado
function weightedAvgIsAbsTop(rows) {
  const valid = rows.filter(r =>
    r.impresiones > 0 && r.isAbsTop !== null && r.isAbsTop > 0
  );
  if (!valid.length) return null;
  const totalNum  = valid.reduce((s, r) => s + r.impresiones * (r.isAbsTop / 100), 0);
  const totalImpr = valid.reduce((s, r) => s + r.impresiones, 0);
  return totalImpr > 0 ? (totalNum / totalImpr) * 100 : null;
}

// IS Top (Parte Superior): Σ(Impr × IS_Top) / Σ Impr  — mismo método que IS Abs Top
function weightedAvgIsTop(rows) {
  const valid = rows.filter(r =>
    r.impresiones > 0 && r.isTop !== null && r.isTop > 0
  );
  if (!valid.length) return null;
  const totalNum  = valid.reduce((s, r) => s + r.impresiones * (r.isTop / 100), 0);
  const totalImpr = valid.reduce((s, r) => s + r.impresiones, 0);
  return totalImpr > 0 ? (totalNum / totalImpr) * 100 : null;
}

// Simple average para KPIs no-IS
function avg(rows, field) {
  const vals = rows.map(r => r[field]).filter(v => v !== null && v !== undefined);
  if (!vals.length) return null;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

// ─── Main analysis ────────────────────────────────────────────────────────────

export function analyzeData(rows) {
  const allDates = [...new Set(rows.map(r => r.semanaDate.getTime()))].sort((a, b) => a - b);
  const allWeeks = allDates.map(t => new Date(t));
  const lastWeekDate = allWeeks[allWeeks.length - 1];
  const campaigns = [...new Set(rows.map(r => r.campana))];

  const campaignData = campaigns.map(campana => {
    const campRows = rows
      .filter(r => r.campana === campana)
      .sort((a, b) => a.semanaDate - b.semanaDate);

    const lastRow      = campRows[campRows.length - 1];
    const allWeeksRows = campRows;
    const prev4Rows    = campRows.slice(-5, -1);

    // ── IS Búsqueda (ponderado por impresiones elegibles) ──
    const isAvgAll = weightedAvgIS(allWeeksRows);
    const isAvg4   = weightedAvgIS(prev4Rows);
    const isLast   = lastRow?.is ?? null;

    // ── IS Abs Top (ponderado por impresiones × IS_AT) ──
    const atAvgAll = weightedAvgIsAbsTop(allWeeksRows);
    const atAvg4   = weightedAvgIsAbsTop(prev4Rows);
    const atLast   = lastRow?.isAbsTop ?? null;

    // ── IS Top Parte Superior (ponderado por impresiones × IS_Top) ──
    const itAvgAll = weightedAvgIsTop(allWeeksRows);
    const itAvg4   = weightedAvgIsTop(prev4Rows);
    const itLast   = lastRow?.isTop ?? null;

    const stats = {
      is: {
        lastVal: isLast,
        avg8:    isAvgAll,
        avg4:    isAvg4,
        delta8:  isLast !== null && isAvgAll !== null ? isLast - isAvgAll : null,
        delta4:  isLast !== null && isAvg4   !== null ? isLast - isAvg4   : null,
      },
      isAbsTop: {
        lastVal: atLast,
        avg8:    atAvgAll,
        avg4:    atAvg4,
        delta8:  atLast !== null && atAvgAll !== null ? atLast - atAvgAll : null,
        delta4:  atLast !== null && atAvg4   !== null ? atLast - atAvg4   : null,
      },
      isTop: {
        lastVal: itLast,
        avg8:    itAvgAll,
        avg4:    itAvg4,
        delta8:  itLast !== null && itAvgAll !== null ? itLast - itAvgAll : null,
        delta4:  itLast !== null && itAvg4   !== null ? itLast - itAvg4   : null,
      },
      lostRank: {
        lastVal: lastRow?.lostRank ?? null,
        avg8:    avg(allWeeksRows, 'lostRank'),
        avg4:    avg(prev4Rows,    'lostRank'),
        delta8:  lastRow?.lostRank !== null ? lastRow.lostRank - avg(allWeeksRows, 'lostRank') : null,
        delta4:  lastRow?.lostRank !== null ? lastRow.lostRank - avg(prev4Rows,    'lostRank') : null,
      },
      coste: {
        lastVal: lastRow?.coste ?? null,
        avg8:    avg(allWeeksRows, 'coste'),
        avg4:    avg(prev4Rows,    'coste'),
        delta8:  null,
        delta4:  null,
      },
      impresiones: {
        lastVal: lastRow?.impresiones ?? null,
        avg8:    avg(allWeeksRows, 'impresiones'),
        avg4:    avg(prev4Rows,    'impresiones'),
        delta8:  null,
        delta4:  null,
      },
    };

    return { campana, lastWeek: lastRow?.semana, lastDate: lastRow?.semanaDate, stats, history: campRows, lastRow };
  });

  // ── ALERTAS OPERATIVAS ────────────────────────────────────────────────────
  const operativeAlerts = [];

  campaignData.forEach(cd => {
    const alerts = [];
    const { stats } = cd;

    // IS Búsqueda cae > 10pp → ALERTA | > 20pp → CRÍTICO
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

    // IS Abs Top cae > 15pp → ALERTA | > 25pp → CRÍTICO
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

  operativeAlerts.sort((a, b) => {
    if (a.maxSeverity !== b.maxSeverity) return a.maxSeverity === 'critical' ? -1 : 1;
    const aWorst = Math.min(...a.alerts.map(al => al.delta8));
    const bWorst = Math.min(...b.alerts.map(al => al.delta8));
    return aWorst - bWorst;
  });

  // ── SALUD ESTRUCTURAL DE MARCA ────────────────────────────────────────────
  const brandHealth = campaignData.map(cd => {
    const { lastRow } = cd;
    if (!lastRow) return null;

    const conditions = [];

    if (lastRow.is !== null) {
      conditions.push({
        kpi: 'is', label: 'Cuota Imp. Búsqueda',
        value: lastRow.is, threshold: 85, operator: '<',
        pass: lastRow.is >= 85,
        severity: lastRow.is < 70 ? 'critical' : 'warning',
      });
    }
    if (lastRow.isTop !== null) {
      conditions.push({
        kpi: 'isTop', label: 'Cuota Imp. Parte Sup.',
        value: lastRow.isTop, threshold: 60, operator: '<',
        pass: lastRow.isTop >= 60,
        severity: lastRow.isTop < 45 ? 'critical' : 'warning',
      });
    }
    if (lastRow.lostRank !== null) {
      conditions.push({
        kpi: 'lostRank', label: 'Imp. Perd. Ranking',
        value: lastRow.lostRank, threshold: 10, operator: '>',
        pass: lastRow.lostRank <= 10,
        severity: lastRow.lostRank > 15 ? 'critical' : 'warning',
      });
    }

    const failed      = conditions.filter(c => !c.pass);
    const hasCritical = failed.some(c => c.severity === 'critical');
    const status      = failed.length === 0 ? 'ok' : hasCritical ? 'critical' : 'warning';

    return { ...cd, conditions, failed, status, isWeakBrand: failed.length > 0 };
  }).filter(Boolean);

  brandHealth.sort((a, b) => {
    const order = { critical: 0, warning: 1, ok: 2 };
    return (order[a.status] ?? 3) - (order[b.status] ?? 3);
  });

  return {
    allWeeks, lastWeekDate, campaigns, campaignData,
    operativeAlerts, brandHealth,
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

export function kpiClass(val, kpi) {
  if (val === null || val === undefined) return 'kpi-neutral';
  if (kpi === 'lostRank' || kpi === 'lostBudget') {
    if (val <= 5)  return 'kpi-good';
    if (val <= 15) return 'kpi-warn';
    return 'kpi-bad';
  }
  if (val >= 85) return 'kpi-good';
  if (val >= 60) return 'kpi-warn';
  return 'kpi-bad';
}

export function sortRows(rows, field, dir) {
  return [...rows].sort((a, b) => {
    const av = a[field] ?? a.stats?.[field]?.lastVal ?? 0;
    const bv = b[field] ?? b.stats?.[field]?.lastVal ?? 0;
    return dir === 'asc' ? av - bv : bv - av;
  });
}