import React, { useState } from 'react';
import { Zap, AlertTriangle, Shield, Download, RefreshCw, FileSpreadsheet } from 'lucide-react';
import UploadPage     from './pages/UploadPage.jsx';
import OperativePage  from './pages/OperativePage.jsx';
import BrandHealthPage from './pages/BrandHealthPage.jsx';
import { downloadReport } from './utils/export.js';

export default function App() {
  const [analysisData, setAnalysisData] = useState(null);
  const [fileName, setFileName]         = useState('');
  const [activeTab, setActiveTab]       = useState('operative');
  const [downloading, setDownloading]   = useState(false);

  function handleDataLoaded(data, fname) {
    setAnalysisData(data);
    setFileName(fname);
    setActiveTab('operative');
  }

  function handleReset() {
    setAnalysisData(null);
    setFileName('');
  }

  async function handleDownload() {
    if (!analysisData) return;
    setDownloading(true);
    try {
      downloadReport(analysisData);
    } finally {
      setTimeout(() => setDownloading(false), 800);
    }
  }

  if (!analysisData) {
    return <UploadPage onDataLoaded={handleDataLoaded} />;
  }

  const { operativeAlerts, brandHealth, totalCampaigns, allWeeks, lastWeekDate } = analysisData;
  const criticalCount = operativeAlerts.filter(a => a.maxSeverity === 'critical').length;
  const weakBrands    = brandHealth.filter(b => b.isWeakBrand).length;

  const lastWeekStr = lastWeekDate
    ? `${lastWeekDate.getDate().toString().padStart(2, '0')}/${(lastWeekDate.getMonth() + 1).toString().padStart(2, '0')}/${lastWeekDate.getFullYear()}`
    : '—';

  const tabs = [
    {
      id: 'operative',
      label: 'Control Operativo',
      icon: AlertTriangle,
      count: operativeAlerts.length,
      countColor: operativeAlerts.length > 0 ? 'var(--danger)' : 'var(--success)',
    },
    {
      id: 'brand',
      label: 'Salud de Marca',
      icon: Shield,
      count: weakBrands,
      countColor: weakBrands > 0 ? 'var(--warning)' : 'var(--success)',
    },
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>
      {/* Top bar */}
      <header style={{
        background: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border)',
        padding: '0 24px',
        position: 'sticky', top: 0, zIndex: 100,
        backdropFilter: 'blur(12px)',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', height: 56, gap: 16 }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 7,
              background: 'linear-gradient(135deg, var(--accent), #0088aa)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Zap size={14} color="#000" />
            </div>
            <span className="display" style={{ fontSize: 16, fontWeight: 800, letterSpacing: '-0.02em' }}>
              Visibility <span className="text-accent">Radar</span>
            </span>
          </div>

          {/* Divider */}
          <div style={{ width: 1, height: 24, background: 'var(--border)' }} />

          {/* File info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
            <FileSpreadsheet size={13} color="var(--text-muted)" />
            <span className="mono" style={{ fontSize: 11, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 220 }}>
              {fileName}
            </span>
            <span className="badge badge-accent">{allWeeks.length} sem.</span>
            <span className="badge badge-accent">{totalCampaigns} camp.</span>
          </div>

          {/* Spacer */}
          <div style={{ flex: 1 }} />

          {/* Last week badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div className="dot dot-green" style={{ animation: 'pulse-glow 2s ease infinite' }} />
            <span className="mono" style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Sem. {lastWeekStr}</span>
          </div>

          {/* Alert summary */}
          {criticalCount > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', background: 'var(--danger-dim)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255,69,96,0.3)' }}>
              <AlertTriangle size={12} color="var(--danger)" />
              <span className="mono" style={{ fontSize: 11, color: 'var(--danger)', fontWeight: 700 }}>
                {criticalCount} crítica{criticalCount > 1 ? 's' : ''}
              </span>
            </div>
          )}

          {/* Actions */}
          <button className="btn btn-success" onClick={handleDownload} disabled={downloading} style={{ fontSize: 11, padding: '6px 12px' }}>
            <Download size={13} />
            {downloading ? 'Generando…' : 'Exportar'}
          </button>
          <button className="btn btn-ghost" onClick={handleReset} style={{ fontSize: 11, padding: '6px 10px' }}>
            <RefreshCw size={13} />
          </button>
        </div>
      </header>

      {/* Main */}
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 24px 60px' }}>
        {/* Tabs */}
        <div style={{ marginBottom: 24 }}>
          <div className="tab-bar">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <Icon size={15} />
                  {tab.label}
                  <span style={{
                    background: activeTab === tab.id ? 'transparent' : 'var(--bg-base)',
                    color: tab.countColor,
                    border: `1px solid ${tab.countColor}`,
                    borderRadius: 20,
                    fontFamily: 'var(--font-mono)',
                    fontSize: 11,
                    fontWeight: 700,
                    padding: '1px 7px',
                    minWidth: 22,
                    textAlign: 'center',
                  }}>
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Page content */}
        {activeTab === 'operative' && <OperativePage  data={analysisData} />}
        {activeTab === 'brand'     && <BrandHealthPage data={analysisData} />}
   </main>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid var(--border)',
        padding: '20px 24px',
        textAlign: 'center',
        color: 'var(--text-muted)',
        fontFamily: 'var(--font-mono)',
        fontSize: '12px',
        marginTop: 'auto',
      }}>
        Visibility Radar · 2026 by Camilo Soler
      </footer>
    </div>
  );
}
