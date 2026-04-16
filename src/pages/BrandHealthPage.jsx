import React, { useState } from 'react';
import { ShieldAlert, ShieldCheck, ChevronUp, ChevronDown, ChevronsUpDown, Info } from 'lucide-react';
import { fmtPct, kpiClass } from '../utils/analysis.js';

function SortIcon({ field, sortField, sortDir }) {
  if (sortField !== field) return <ChevronsUpDown size={11} style={{ opacity: 0.35, marginLeft: 3 }} />;
  return sortDir === 'asc'
    ? <ChevronUp size={11} style={{ color: 'var(--accent)', marginLeft: 3 }} />
    : <ChevronDown size={11} style={{ color: 'var(--accent)', marginLeft: 3 }} />;
}

function StatusIcon({ status }) {
  if (status === 'ok')       return <ShieldCheck size={16} color="var(--success)" />;
  if (status === 'critical') return <ShieldAlert size={16} color="var(--danger)" />;
  return <ShieldAlert size={16} color="var(--warning)" />;
}

function ConditionBadge({ cond }) {
  if (cond.pass) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px 12px', background: 'var(--success-dim)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(0,227,150,0.25)', minWidth: 90 }}>
        <span className="mono kpi-good" style={{ fontSize: 14, fontWeight: 700 }}>{fmtPct(cond.value)}</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--success)', marginTop: 2 }}>✓ OK</span>
      </div>
    );
  }
  const isCrit = cond.severity === 'critical';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px 12px', background: isCrit ? 'var(--danger-dim)' : 'var(--warning-dim)', borderRadius: 'var(--radius-sm)', border: `1px solid ${isCrit ? 'rgba(255,69,96,0.25)' : 'rgba(255,184,0,0.25)'}`, minWidth: 90 }}>
      <span className="mono" style={{ fontSize: 14, fontWeight: 700, color: isCrit ? 'var(--danger)' : 'var(--warning)' }}>{fmtPct(cond.value)}</span>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: isCrit ? 'var(--danger)' : 'var(--warning)', marginTop: 2 }}>
        {cond.operator} {cond.threshold}%
      </span>
    </div>
  );
}

function BrandCard({ entry, idx }) {
  const [expanded, setExpanded] = useState(false);
  const { status, campana, conditions, failed, lastRow } = entry;
  const borderColor = status === 'ok' ? 'var(--success)' : status === 'critical' ? 'var(--danger)' : 'var(--warning)';

  const statusLabel = status === 'ok' ? 'SALUDABLE' : status === 'critical' ? 'CRÍTICO' : 'DÉBIL';
  const statusTagClass = status === 'ok' ? 'tag-ok' : status === 'critical' ? 'tag-critical' : 'tag-warning';

  return (
    <div
      className="alert-card fade-in"
      style={{ borderLeft: `3px solid ${borderColor}`, animationDelay: `${idx * 0.04}s` }}
    >
      <div
        style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', gap: 12 }}
        onClick={() => setExpanded(e => !e)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
          <StatusIcon status={status} />
          <div style={{ minWidth: 0 }}>
            <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {campana}
            </p>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {failed.map((f, i) => (
                <span key={i} className={`tag ${f.severity === 'critical' ? 'tag-critical' : 'tag-warning'}`} style={{ fontSize: 10 }}>
                  {f.label}
                </span>
              ))}
              {failed.length === 0 && (
                <span className="tag tag-ok" style={{ fontSize: 10 }}>Todos los KPIs dentro del umbral</span>
              )}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <span className={`tag ${statusTagClass}`}>
            {statusLabel}
          </span>
          {expanded ? <ChevronUp size={16} style={{ color: 'var(--text-muted)' }} /> : <ChevronDown size={16} style={{ color: 'var(--text-muted)' }} />}
        </div>
      </div>

      {expanded && (
        <div style={{ borderTop: '1px solid var(--border)', padding: '16px 18px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 14 }}>
            {conditions.map((cond, i) => (
              <div key={i} style={{ background: 'var(--bg-base)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', padding: '12px 14px' }}>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
                  {cond.label}
                </p>
                <ConditionBadge cond={cond} />
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', marginTop: 8 }}>
                  Umbral: {cond.operator} {cond.threshold}%
                </p>
              </div>
            ))}
          </div>
          {/* Additional KPIs */}
          {lastRow && (
            <div style={{ background: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', padding: '12px 14px' }}>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
                Datos adicionales — última semana ({entry.lastWeek})
              </p>
              <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                {[
                  ['Impresiones', lastRow.impresiones !== null ? Math.round(lastRow.impresiones).toLocaleString('es-ES') : '—', ''],
                  ['Coste',       lastRow.coste !== null ? `€${lastRow.coste.toFixed(2)}` : '—', ''],
                  ['Imp. Perd. Presup.', fmtPct(lastRow.lostBudget), 'kpi'],
                ].map(([k, v, t]) => (
                  <div key={k}>
                    <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', marginBottom: 2 }}>{k}</p>
                    <p className="mono" style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 600 }}>{v}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function BrandHealthPage({ data }) {
  const { brandHealth, lastWeekDate } = data;
  const [sortField, setSortField] = useState('is');
  const [sortDir, setSortDir]     = useState('asc');
  const [view, setView]           = useState('cards'); // 'cards' | 'table'
  const [filter, setFilter]       = useState('all');  // 'all' | 'weak' | 'ok'

  const lastWeekStr = lastWeekDate
    ? `${lastWeekDate.getDate().toString().padStart(2, '0')}/${(lastWeekDate.getMonth() + 1).toString().padStart(2, '0')}/${lastWeekDate.getFullYear()}`
    : '—';

  function handleSort(field) {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  }

  const filtered = brandHealth.filter(b => {
    if (filter === 'weak') return b.isWeakBrand;
    if (filter === 'ok')   return !b.isWeakBrand;
    return true;
  });

  const tableRows = [...filtered].sort((a, b) => {
    const av = a.lastRow?.[sortField] ?? a.stats?.[sortField]?.lastVal ?? 0;
    const bv = b.lastRow?.[sortField] ?? b.stats?.[sortField]?.lastVal ?? 0;
    return sortDir === 'asc' ? av - bv : bv - av;
  });

  const ok       = brandHealth.filter(b => b.status === 'ok').length;
  const weak     = brandHealth.filter(b => b.isWeakBrand).length;
  const critical = brandHealth.filter(b => b.status === 'critical').length;

  const kpiCols = [
    { key: 'is',       label: 'Cuota Imp. Búsq.',  th: 'IS',    threshold: '< 85%' },
    { key: 'isTop',    label: 'Cuota Imp. Sup.',    th: 'IS-T',  threshold: '< 60%' },
    { key: 'isAbsTop', label: 'Cuota Imp. AbsTop',  th: 'IS-AT', threshold: null },
    { key: 'lostRank', label: 'Imp. Perd. Ranking', th: 'LP-R',  threshold: '> 10%' },
  ];

  return (
    <div style={{ padding: '24px 0' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }} className="fade-in">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <div style={{ padding: '4px 10px', background: 'var(--accent-dim)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(0,212,255,0.3)' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--accent)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Salud Estructural de Marca
            </span>
          </div>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>
            Última semana: {lastWeekStr}
          </span>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: 13, maxWidth: 600 }}>
          Evaluación absoluta del estado de marca de todas las campañas.
          Detecta branding débil basado en umbrales fijos de visibilidad.
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }} className="fade-in-delay-1">
        <div className="stat-pill">
          <span className="value" style={{ color: 'var(--text-primary)' }}>{brandHealth.length}</span>
          <span className="label">Total Campañas</span>
        </div>
        <div className="stat-pill">
          <span className="value" style={{ color: 'var(--success)' }}>{ok}</span>
          <span className="label">Saludables</span>
        </div>
        <div className="stat-pill">
          <span className="value" style={{ color: 'var(--warning)' }}>{weak - critical}</span>
          <span className="label">Branding Débil</span>
        </div>
        <div className="stat-pill">
          <span className="value" style={{ color: 'var(--danger)' }}>{critical}</span>
          <span className="label">Críticas</span>
        </div>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }} className="fade-in-delay-2">
        <div style={{ display: 'flex', gap: 6 }}>
          {[['all', 'Todas'], ['weak', 'Branding Débil'], ['ok', 'Saludables']].map(([val, label]) => (
            <button
              key={val}
              className={`btn ${filter === val ? 'btn-outline' : 'btn-ghost'}`}
              onClick={() => setFilter(val)}
              style={{ padding: '6px 12px' }}
            >
              {label}
            </button>
          ))}
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
          <button className={`btn ${view === 'cards' ? 'btn-outline' : 'btn-ghost'}`} onClick={() => setView('cards')} style={{ padding: '6px 12px' }}>Tarjetas</button>
          <button className={`btn ${view === 'table' ? 'btn-outline' : 'btn-ghost'}`} onClick={() => setView('table')} style={{ padding: '6px 12px' }}>Tabla</button>
        </div>
      </div>

      {/* CARDS VIEW */}
      {view === 'cards' && (
        <div className="fade-in">
          {/* Legend */}
          <div style={{ display: 'flex', gap: 20, padding: '10px 14px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', marginBottom: 16, flexWrap: 'wrap' }}>
            {[
              ['dot-green', 'IS Búsqueda ≥ 85%'],
              ['dot-yellow', 'IS Parte Sup. ≥ 60%'],
              ['dot-red', 'Imp. Perd. Ranking ≤ 10%'],
            ].map(([dot, label]) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div className={`dot ${dot}`} />
                <span className="mono" style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{label}</span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: 40 }}>
                <p style={{ color: 'var(--text-muted)' }}>No hay campañas para este filtro.</p>
              </div>
            ) : filtered.map((entry, idx) => (
              <BrandCard key={entry.campana} entry={entry} idx={idx} />
            ))}
          </div>
        </div>
      )}

      {/* TABLE VIEW */}
      {view === 'table' && (
        <div className="fade-in">
          <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Info size={13} color="var(--text-muted)" />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>
              Valores absolutos de la última semana · Clic en encabezado para ordenar
            </span>
          </div>
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Estado</th>
                  <th>Campaña</th>
                  {kpiCols.map(col => (
                    <th key={col.key} className="sortable-th" onClick={() => handleSort(col.key)} title={col.label}>
                      {col.th}
                      {col.threshold && <span style={{ color: 'var(--text-muted)', fontSize: 10, fontWeight: 400, marginLeft: 4 }}>{col.threshold}</span>}
                      <SortIcon field={col.key} sortField={sortField} sortDir={sortDir} />
                    </th>
                  ))}
                  <th className="sortable-th" onClick={() => handleSort('coste')}>
                    Coste <SortIcon field="coste" sortField={sortField} sortDir={sortDir} />
                  </th>
                  <th className="sortable-th" onClick={() => handleSort('impresiones')}>
                    Impr. <SortIcon field="impresiones" sortField={sortField} sortDir={sortDir} />
                  </th>
                  <th>Condiciones Fallidas</th>
                </tr>
              </thead>
              <tbody>
                {tableRows.map((entry, i) => {
                  const { status, campana, conditions, failed, lastRow } = entry;
                  const statusTagClass = status === 'ok' ? 'tag-ok' : status === 'critical' ? 'tag-critical' : 'tag-warning';
                  const statusLabel = status === 'ok' ? '✓ OK' : status === 'critical' ? '⚠ CRÍTICO' : '↓ DÉBIL';

                  return (
                    <tr key={campana} style={{
                      background: status === 'critical' ? 'rgba(255,69,96,0.04)'
                        : status === 'warning' ? 'rgba(255,184,0,0.03)' : ''
                    }}>
                      <td><span className={`tag ${statusTagClass}`}>{statusLabel}</span></td>
                      <td style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-primary)', minWidth: 220 }}>{campana}</td>
                      {kpiCols.map(col => {
                        const val = lastRow?.[col.key];
                        const cond = conditions.find(c => c.kpi === col.key);
                        return (
                          <td key={col.key} className={kpiClass(val, col.key)}>
                            {fmtPct(val)}
                            {cond && !cond.pass && <span style={{ marginLeft: 4, fontSize: 10 }}>⚠</span>}
                          </td>
                        );
                      })}
                      <td style={{ color: 'var(--text-secondary)' }}>
                        {lastRow?.coste !== null ? `€${lastRow?.coste?.toFixed(2)}` : '—'}
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>
                        {lastRow?.impresiones !== null ? Math.round(lastRow?.impresiones)?.toLocaleString('es-ES') : '—'}
                      </td>
                      <td>
                        {failed.length === 0
                          ? <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>Ninguna</span>
                          : failed.map((f, j) => (
                              <span key={j} className={`tag ${f.severity === 'critical' ? 'tag-critical' : 'tag-warning'}`} style={{ fontSize: 10, marginRight: 4 }}>
                                {f.label}
                              </span>
                            ))
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
