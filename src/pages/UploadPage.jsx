import React, { useState, useRef } from 'react';
import { parseRows, analyzeData } from '../utils/analysis.js';
import { Upload, FileSpreadsheet, AlertCircle, Zap } from 'lucide-react';

function parseTSVorCSV(text) {
  const firstLine = text.split('\n')[0] || '';
  const sep = firstLine.includes('\t') ? '\t' : ',';
  const lines = text.split('\n').filter(l => l.trim() !== '');
  if (lines.length < 2) return [];
  const headers = lines[0].split(sep).map(h => h.trim().replace(/^\uFEFF/, ''));
  return lines.slice(1).map(line => {
    const vals = line.split(sep);
    const row = {};
    headers.forEach((h, i) => { row[h] = (vals[i] || '').trim(); });
    return row;
  }).filter(r => Object.values(r).some(v => v !== ''));
}

function readAsText(file, encoding) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result.replace(/^\uFEFF/, ''));
    reader.onerror = reject;
    reader.readAsText(file, encoding);
  });
}

async function readExcel(file) {
  const XLSX = await import('xlsx');
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(new Uint8Array(e.target.result), { type: 'array' });
        resolve(XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: '' }));
      } catch(err) { reject(err); }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

export default function UploadPage({ onDataLoaded }) {
  const [dragging, setDragging] = useState(false);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [fileName, setFileName] = useState('');
  const inputRef = useRef();

  async function processFile(file) {
    if (!file) return;
    setError(''); setLoading(true); setFileName(file.name);
    try {
      let rawRows = [];
      const ext = file.name.split('.').pop().toLowerCase();

      if (ext === 'xlsx' || ext === 'xls') {
        rawRows = await readExcel(file);
      } else {
        // Try UTF-16 first (Google Ads export), fallback to UTF-8
        let text = await readAsText(file, 'UTF-16LE');
        const nulls = (text.match(/\x00/g) || []).length;
        if (nulls > text.length * 0.1 || text.trim() === '') {
          text = await readAsText(file, 'UTF-8');
        }
        rawRows = parseTSVorCSV(text);
      }

      if (!rawRows.length) {
        setError('El archivo está vacío o no tiene datos reconocibles.'); setLoading(false); return;
      }
      const parsed = parseRows(rawRows);
      if (!parsed.length) {
        setError('No se pudieron leer filas válidas. Verifica que el archivo tenga las columnas correctas (Semana, Campaña, Cuota de impr. de búsqueda…)'); setLoading(false); return;
      }
      const result = analyzeData(parsed);
      setLoading(false);
      onDataLoaded(result, file.name);
    } catch (err) {
      console.error(err);
      setError('Error al procesar el archivo: ' + err.message); setLoading(false);
    }
  }

  function onFileChange(e) { const f = e.target.files[0]; if (f) processFile(f); }
  function onDrop(e) { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) processFile(f); }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
      <div style={{ textAlign: 'center', marginBottom: 48 }} className="fade-in">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: '12px', background: 'linear-gradient(135deg, var(--accent), #0088aa)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 32px var(--accent-glow)' }}>
            <Zap size={24} color="#000" />
          </div>
          <h1 className="display" style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.02em' }}>
            Competitivity
          </h1>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontSize: 13, letterSpacing: '0.04em' }}>
          SEM INTELLIGENCE · GOOGLE ADS & BING ADS
        </p>
      </div>

      <div className="card fade-in-delay-1" style={{ width: '100%', maxWidth: 560 }}>
        <div
          className={`upload-zone${dragging ? ' drag-over' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
        >
          <input ref={inputRef} type="file" accept=".xlsx,.xls,.csv,.tsv" onChange={onFileChange} style={{ display: 'none' }} />
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, pointerEvents: 'none' }}>
            {loading ? (
              <>
                <div style={{ width: 56, height: 56, border: '3px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                <p className="mono" style={{ color: 'var(--accent)', fontSize: 13 }}>Procesando archivo…</p>
              </>
            ) : (
              <>
                <div style={{ width: 56, height: 56, borderRadius: 14, background: 'var(--accent-dim)', border: '1px solid var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Upload size={24} color="var(--accent)" />
                </div>
                <div>
                  <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, marginBottom: 6 }}>{fileName || 'Arrastra tu archivo aquí'}</p>
                  <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>o haz clic para seleccionar</p>
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                  {['.xlsx', '.xls', '.csv', '.tsv'].map(ext => <span key={ext} className="badge badge-accent">{ext}</span>)}
                </div>
              </>
            )}
          </div>
        </div>

        {error && (
          <div style={{ marginTop: 16, padding: '12px 16px', background: 'var(--danger-dim)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255,69,96,0.3)', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <AlertCircle size={16} color="var(--danger)" style={{ flexShrink: 0, marginTop: 1 }} />
            <p style={{ color: 'var(--danger)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>{error}</p>
          </div>
        )}

        <div style={{ marginTop: 20, padding: '14px 16px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Formato esperado</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {[['Semana','Fecha inicio de semana natural (Lunes)'],['Campaña','Nombre de la campaña'],['Impr. / Coste','KPIs de volumen'],['Cuotas de imp.','4 columnas de share of voice'],['Imp. perdidas','Presupuesto + Ranking']].map(([k,v]) => (
              <div key={k} style={{ display: 'flex', gap: 10 }}>
                <span className="mono" style={{ color: 'var(--accent)', fontSize: 11, minWidth: 120 }}>{k}</span>
                <span style={{ color: 'var(--text-secondary)', fontSize: 11 }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <p className="fade-in-delay-2" style={{ marginTop: 32, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 11, textAlign: 'center' }}>
        Los archivos se procesan localmente · Sin envío de datos al servidor
      </p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
