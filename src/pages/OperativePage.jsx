import React, { useState } from 'react';
import { AlertTriangle, TrendingDown, ChevronUp, ChevronDown, ChevronsUpDown, Info } from 'lucide-react';
import { fmtPct, fmtDelta, deltaClass, kpiClass } from '../utils/analysis.js';

function SortIcon({ field, sortField, sortDir }) {
  if (sortField !== field) return <ChevronsUpDown size={11} style={{ opacity: 0.35, marginLeft: 3 }} />;
  return sortDir === 'asc'
    ? <ChevronUp size={11} style={{ color: 'var(--accent)', marginLeft: 3 }} />
    : <ChevronDown size={11} style={{ color: 'var(--accent)', marginLeft: 3 }} />;
}

function AlertCard({ entry, idx }) {
  const [expanded, setExpanded] = useState(false);
  const isCritical = entry.maxSeverity === 'critical';

  return (
    <div
      className={`alert-card ${isCritical ? 'critical' : 'warning'} fade-in`}
      style={{ animationDelay: `${idx * 0.05}s` }}
    >
      {/* Header */}
      <div
        style={{
          padding: '14px 18px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          cursor: 'pointer', gap: 12,
        }}
        onClick={() => setExpanded(e => !e)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10, flexShrink: 0,
            background: isCritical ? 'var(--danger-dim)' : 'var(--warning-dim)',
            border: `1px solid ${isCritical ? 'rgba(255,69,96,0.3)' : 'rgba(255,184,0,0.3)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {isCritical
              ? <AlertTriangle size={16} color="var(--danger)" />
              : <TrendingDown size={16} color="var(--warning)" />}
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {entry.campana}
            </p>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {entry.alerts.map((alert, i) => (
                <span key={i} className={`tag ${alert.severity === 'critical' ? 'tag-critical' : 'tag-warning'}`}>
                  {alert.label}
                </span>
              ))}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <span className={`tag ${isCritical ? 'tag-critical' : 'tag-warning'}`}>
            {isCritical ? '⚠ CRÍTICO' : '↓ ALERTA'}
          </span>
          {expanded
            ? <ChevronUp size={16} style={{ color: 'var(--text-muted)' }} />
            : <ChevronDown size={16} style={{ color: 'var(--text-muted)' }} />}
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div style={{ borderTop: '1px solid var(--border)', padding: '16px 18px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {entry.alerts.map((alert, i) => (
              <div key={i} style={{
                padding: '14px 16px',
                background: 'var(--bg-base)',
                borderRadius: 'var(--radius-md)',
                border: `1px solid ${alert.severity === 'critical' ? 'rgba(255,69,96,0.2)' : 'rgba(255,184,0,0.2)'}`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                  <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, color: 'var(--text-primary)' }}>
                    {alert.label}
                  </span>
                  <span className={`tag ${alert.severity === 'critical' ? 'tag-critical' : 'tag-warning'}`} style={{ fontSize: 10 }}>
                    Umbral: {alert.threshold}pp
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                  {[
                    { label: 'Última Semana', value: fmtPct(alert.lastVal), cls: kpiClass(alert.lastVal, alert.kpi), big: true },
                    { label: 'Media 8 Semanas', value: fmtPct(alert.avg8), cls: 'kpi-neutral' },
                    { label: 'Δ vs Media 8S', value: fmtDelta(alert.delta8), cls: deltaClass(alert.delta8, alert.kpi === 'lostRank') },
                    { label: 'Δ vs Media 4S', value: fmtDelta(alert.delta4), cls: deltaClass(alert.delta4, alert.kpi === 'lostRank') },
                  ].map((item, j) => (
                    <div key={j} style={{
                      background: 'var(--bg-card)', borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border)', padding: '10px 12px',
                    }}>
                      <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {item.label}
                      </p>
                      <p className={`mono ${item.cls}`} style={{ fontSize: item.big ? 18 : 15, fontWeight: 700 }}>
                        {item.value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function OperativePage({ data }) {
  const { operativeAlerts, campaignData, lastWeekDate, allWeeks } = data;

  // Table sort state
  const [sortField, setSortField] = useState('is');
  const [sortDir, setSortDir] = useState('asc');
  const [tab, setTab] = useState('alerts'); // 'alerts' | 'table'

  function handleSort(field) {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  }

  const lastWeekStr = lastWeekDate
    ? `${lastWeekDate.getDate().toString().padStart(2, '0')}/${(lastWeekDate.getMonth() + 1).toString().padStart(2, '0')}/${lastWeekDate.getFullYear()}`
    : '—';

  // Table data: last week per campaign, with stats
  const tableRows = [...campaignData].sort((a, b) => {
    let av = a.stats[sortField]?.lastVal ?? 0;
    let bv = b.stats[sortField]?.lastVal ?? 0;
    return sortDir === 'asc' ? av - bv : bv - av;
  });

  const kpiCols = [
    { key: 'is',       label: 'Cuota Imp. Búsq.', short: 'IS' },
    { key: 'isTop',    label: 'Cuota Imp. Sup.',   short: 'IS-T' },
    { key: 'isAbsTop', label: 'Cuota Imp. AbsTop', short: 'IS-AT' },
    { key: 'lostRank', label: 'Imp. Perd. Rank',   short: 'LP-R' },
  ];

  return (
    <div style={{ padding: '24px 0' }}>
      {/* Section header */}
      <div style={{ marginBottom: 24 }} className="fade-in">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <div style={{
            padding: '4px 10px', background: 'var(--warning-dim)',
            borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255,184,0,0.3)',
          }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--warning)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Control Semanal Operativo
            </span>
          </div>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>
            Última semana: {lastWeekStr}
          </span>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: 13, maxWidth: 600 }}>
          Compara el rendimiento de la última semana contra las medias históricas.
          Detecta caídas relevantes en cuotas de impresión.
        </p>
      </div>

      {/* Stats pills */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }} className="fade-in-delay-1">
        <div className="stat-pill">
          <span className="value" style={{ color: 'var(--text-primary)' }}>{data.totalCampaigns}</span>
          <span className="label">Campañas</span>
        </div>
        <div className="stat-pill">
          <span className="value" style={{ color: operativeAlerts.length > 0 ? 'var(--danger)' : 'var(--success)' }}>
            {operativeAlerts.length}
          </span>
          <span className="label">Alertas</span>
        </div>
        <div className="stat-pill">
          <span className="value" style={{ color: 'var(--danger)' }}>
            {operativeAlerts.filter(a => a.maxSeverity === 'critical').length}
          </span>
          <span className="label">Críticas</span>
        </div>
        <div className="stat-pill">
          <span className="value" style={{ color: 'var(--warning)' }}>
            {operativeAlerts.filter(a => a.maxSeverity === 'warning').length}
          </span>
          <span className="label">Avisos</span>
        </div>
        <div className="stat-pill">
          <span className="value" style={{ color: 'var(--text-muted)' }}>
            {allWeeks.length}
          </span>
          <span className="label">Semanas</span>
        </div>
      </div>

      {/* Sub tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }} className="fade-in-delay-2">
        <button
          className={`btn ${tab === 'alerts' ? 'btn-outline' : 'btn-ghost'}`}
          onClick={() => setTab('alerts')}
        >
          <AlertTriangle size={14} />
          Alertas ({operativeAlerts.length})
        </button>
        <button
          className={`btn ${tab === 'table' ? 'btn-outline' : 'btn-ghost'}`}
          onClick={() => setTab('table')}
        >
          Tabla completa
        </button>
      </div>

      {/* ALERTS VIEW */}
      {tab === 'alerts' && (
        <div className="fade-in">
          {operativeAlerts.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '60px 40px' }}>
              <div style={{ fontSize: 40, marginBottom: 16 }}>✅</div>
              <p className="display" style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Sin alertas operativas</p>
              <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                Todas las campañas se mantienen dentro de los umbrales establecidos esta semana.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {/* Legend */}
              <div style={{ display: 'flex', gap: 16, padding: '10px 14px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', marginBottom: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div className="dot dot-red" />
                  <span className="mono" style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Caída IS Búsqueda &gt; 10pp vs media 8S</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div className="dot dot-yellow" />
                  <span className="mono" style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Caída Abs. Top &gt; 15pp vs media 8S</span>
                </div>
              </div>
              {operativeAlerts.map((entry, idx) => (
                <AlertCard key={entry.campana} entry={entry} idx={idx} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* TABLE VIEW */}
      {tab === 'table' && (
        <div className="fade-in">
          <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Info size={13} color="var(--text-muted)" />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>
              Valores de la última semana · Haz clic en el encabezado para ordenar
            </span>
          </div>
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Campaña</th>
                  <th>Semana</th>
                  {kpiCols.map(col => (
                    <th
                      key={col.key}
                      className="sortable-th"
                      onClick={() => handleSort(col.key)}
                      title={col.label}
                    >
                      {col.short}
                      <SortIcon field={col.key} sortField={sortField} sortDir={sortDir} />
                    </th>
                  ))}
                  <th className="sortable-th" onClick={() => handleSort('coste')}>
                    Coste <SortIcon field="coste" sortField={sortField} sortDir={sortDir} />
                  </th>
                  <th className="sortable-th" onClick={() => handleSort('impresiones')}>
                    Impr. <SortIcon field="impresiones" sortField={sortField} sortDir={sortDir} />
                  </th>
                  <th>Δ IS (8S)</th>
                  <th>Δ AbsTop (8S)</th>
                  <th>Alertas</th>
                </tr>
              </thead>
              <tbody>
                {tableRows.map((cd, i) => {
                  const hasAlert = operativeAlerts.some(a => a.campana === cd.campana);
                  const alertEntry = operativeAlerts.find(a => a.campana === cd.campana);
                  return (
                    <tr key={cd.campana} style={{ background: hasAlert ? (alertEntry?.maxSeverity === 'critical' ? 'rgba(255,69,96,0.04)' : 'rgba(255,184,0,0.04)') : '' }}>
                      <td style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-primary)', minWidth: 220 }}>
                        {cd.campana}
                      </td>
                      <td style={{ color: 'var(--text-muted)' }}>{cd.lastWeek}</td>
                      {kpiCols.map(col => (
                        <td key={col.key} className={kpiClass(cd.stats[col.key]?.lastVal, col.key)}>
                          {fmtPct(cd.stats[col.key]?.lastVal)}
                        </td>
                      ))}
                      <td style={{ color: 'var(--text-secondary)' }}>
                        {cd.stats.coste?.lastVal !== null ? `€${cd.stats.coste.lastVal?.toFixed(2)}` : '—'}
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>
                        {cd.stats.impresiones?.lastVal !== null ? Math.round(cd.stats.impresiones?.lastVal)?.toLocaleString('es-ES') : '—'}
                      </td>
                      <td className={`mono ${deltaClass(cd.stats.is?.delta8)}`}>
                        {fmtDelta(cd.stats.is?.delta8)}
                      </td>
                      <td className={`mono ${deltaClass(cd.stats.isAbsTop?.delta8)}`}>
                        {fmtDelta(cd.stats.isAbsTop?.delta8)}
                      </td>
                      <td>
                        {hasAlert
                          ? <span className={`tag ${alertEntry?.maxSeverity === 'critical' ? 'tag-critical' : 'tag-warning'}`}>
                              {alertEntry?.alerts.length} alerta{alertEntry?.alerts.length > 1 ? 's' : ''}
                            </span>
                          : <span className="tag tag-ok">OK</span>
                        }
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
