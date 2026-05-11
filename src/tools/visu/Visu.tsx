import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useTheme } from '../../context/ThemeContext';
import {
  parseCsv, extractBarData, generateBarSVG,
  emptyMatrix, getCell, setCell,
} from './visuCore';
import type { MatrixData } from './visuCore';
import './Visu.css';

type Tab = 'csv' | 'matrix';

const SAMPLE_CSV = `製品,売上
Product A,1200
Product B,850
Product C,2100
Product D,640
Product E,1750`;

const Visu = () => {
  const { dark } = useTheme();
  const [tab, setTab] = useState<Tab>('csv');
  const [csvText, setCsvText] = useState(SAMPLE_CSV);
  const [matrix, setMatrix] = useState<MatrixData>(emptyMatrix);
  const [rowCount, setRowCount] = useState(3);
  const [colCount, setColCount] = useState(3);
  const [toast, setToast] = useState('');
  const svgRef = useRef<HTMLDivElement>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 1800);
  }, []);

  // CSV tab
  const csvData = useMemo(() => parseCsv(csvText), [csvText]);
  const barEntries = useMemo(() => extractBarData(csvData), [csvData]);
  const barSvg = useMemo(() => generateBarSVG(barEntries, dark, 520), [barEntries, dark]);

  useEffect(() => {
    if (!svgRef.current) return;
    svgRef.current.innerHTML = barSvg;
  }, [barSvg]);

  // Matrix tab
  const setMatrixRowLabel = (i: number, v: string) => {
    setMatrix(prev => {
      const next = { ...prev, rowLabels: [...prev.rowLabels] };
      next.rowLabels[i] = v;
      return next;
    });
  };

  const setMatrixColLabel = (i: number, v: string) => {
    setMatrix(prev => {
      const next = { ...prev, colLabels: [...prev.colLabels] };
      next.colLabels[i] = v;
      return next;
    });
  };

  const setMatrixCell = (row: string, col: string, value: string) =>
    setMatrix(prev => setCell(prev, row, col, value));

  const syncSize = (rCount: number, cCount: number) => {
    setRowCount(rCount);
    setColCount(cCount);
    setMatrix(prev => ({
      ...prev,
      rowLabels: Array.from({ length: rCount }, (_, i) => prev.rowLabels[i] ?? ''),
      colLabels: Array.from({ length: cCount }, (_, i) => prev.colLabels[i] ?? ''),
    }));
  };

  const rows = matrix.rowLabels.slice(0, rowCount);
  const cols = matrix.colLabels.slice(0, colCount);

  const copyMatrixMarkdown = async () => {
    const header = `| |${cols.map(c => ` ${c || '—'} `).join('|')}|`;
    const sep = `|---|${cols.map(() => '---|').join('')}`;
    const body = rows.map(r =>
      `| ${r || '—'} |${cols.map(c => ` ${getCell(matrix, r, c) || ''} `).join('|')}|`
    ).join('\n');
    const md = `${header}\n${sep}\n${body}`;
    try { await navigator.clipboard.writeText(md); showToast('コピーしました'); }
    catch { showToast('コピー失敗'); }
  };

  return (
    <div className={`visu ${dark ? 'dark' : 'light'}`}>
      <div className="vs-header">
        <div className="vs-logo-icon">📈</div>
        <h1><span className="accent">Visu</span></h1>
      </div>

      <div className="vs-tabs">
        {(['csv', 'matrix'] as Tab[]).map(t => (
          <button
            key={t}
            className={`vs-tab ${tab === t ? 'vs-tab-active' : ''}`}
            onClick={() => setTab(t)}
          >
            {t === 'csv' ? 'CSV → グラフ/表' : '比較マトリクス'}
          </button>
        ))}
      </div>

      {/* ===== CSV TAB ===== */}
      {tab === 'csv' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="vs-panel">
            <div className="vs-panel-title">CSV 入力（1行目がヘッダー）</div>
            <textarea
              className="vs-code-area"
              value={csvText}
              onChange={e => setCsvText(e.target.value)}
              rows={6}
              spellCheck={false}
              aria-label="CSV入力"
              placeholder={SAMPLE_CSV}
            />
            <p className="vs-hint">1列目: ラベル、2列目: 数値 → 棒グラフ表示。3列以上: テーブル表示。</p>
          </div>

          {csvData.headers.length > 0 && (
            <div className="vs-panel">
              <div className="vs-panel-title">テーブル</div>
              <div className="vs-table-wrap">
                <table className="vs-table">
                  <thead>
                    <tr>{csvData.headers.map((h, i) => <th key={i}>{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {csvData.rows.map((row, i) => (
                      <tr key={i}>{csvData.headers.map((_, j) => <td key={j}>{row[j] ?? ''}</td>)}</tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {barEntries.length > 0 && (
            <div className="vs-panel">
              <div className="vs-panel-title">棒グラフ（列 1: ラベル / 列 2: 数値）</div>
              {/* innerHTML set directly to avoid React diff conflict with generated SVG */}
              <div className="vs-svg-wrap">
                <div ref={svgRef} />
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===== MATRIX TAB ===== */}
      {tab === 'matrix' && (
        <div className="vs-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div className="vs-panel-title" style={{ marginBottom: 0 }}>比較マトリクス</div>
            <button className="vs-btn vs-btn-ghost vs-btn-sm" onClick={copyMatrixMarkdown}>
              Markdownコピー
            </button>
          </div>

          <div className="vs-matrix-setup">
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: 12, color: 'var(--vs-text-dim)' }}>
              <span>行数:</span>
              {[2,3,4,5].map(n => (
                <button key={n} className={`vs-btn vs-btn-ghost vs-btn-sm ${rowCount === n ? 'active' : ''}`} style={rowCount === n ? { borderColor: 'var(--vs-amber)', color: 'var(--vs-text)' } : {}} onClick={() => syncSize(n, colCount)}>{n}</button>
              ))}
              <span style={{ marginLeft: 8 }}>列数:</span>
              {[2,3,4,5].map(n => (
                <button key={n} className={`vs-btn vs-btn-ghost vs-btn-sm ${colCount === n ? 'active' : ''}`} style={colCount === n ? { borderColor: 'var(--vs-amber)', color: 'var(--vs-text)' } : {}} onClick={() => syncSize(rowCount, n)}>{n}</button>
              ))}
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="vs-matrix-table">
              <thead>
                <tr>
                  <th style={{ minWidth: 100 }} />
                  {cols.map((c, ci) => (
                    <th key={ci}>
                      <input
                        className="vs-matrix-label-input"
                        placeholder={`列 ${ci + 1}`}
                        value={c}
                        onChange={e => setMatrixColLabel(ci, e.target.value)}
                        aria-label={`列ラベル ${ci + 1}`}
                      />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, ri) => (
                  <tr key={ri}>
                    <td className="vs-matrix-row-header">
                      <input
                        className="vs-matrix-label-input"
                        placeholder={`行 ${ri + 1}`}
                        value={r}
                        onChange={e => setMatrixRowLabel(ri, e.target.value)}
                        aria-label={`行ラベル ${ri + 1}`}
                      />
                    </td>
                    {cols.map((c, ci) => (
                      <td key={ci}>
                        <input
                          className="vs-matrix-cell-input"
                          placeholder="—"
                          value={getCell(matrix, r, c)}
                          onChange={e => setMatrixCell(r, c, e.target.value)}
                          aria-label={`セル ${r} × ${c}`}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {toast && <div className="vs-toast">{toast}</div>}
    </div>
  );
};

export default Visu;
