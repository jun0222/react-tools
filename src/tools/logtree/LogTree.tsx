import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Network } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { parseTree, layoutTree, generateSVG } from './logtreeCore';
import type { Direction } from './logtreeCore';
import './LogTree.css';

const DEFAULT_TEXT = `目標達成
  売上増加
    新規顧客獲得
    既存顧客単価UP
  コスト削減
    固定費削減
    変動費最適化`;

const STORAGE_KEY = 'logtree-text';

const LogTree = () => {
  const { dark } = useTheme();
  const [text, setText] = useState(() => {
    try { return localStorage.getItem(STORAGE_KEY) ?? DEFAULT_TEXT; }
    catch { return DEFAULT_TEXT; }
  });
  const [direction, setDirection] = useState<Direction>('right');
  const [debounced, setDebounced] = useState(text);
  const [toast, setToast] = useState('');

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, text); } catch { /* ignore */ }
  }, [text]);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(text), 300);
    return () => clearTimeout(t);
  }, [text]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 1800);
  }, []);

  const svgContent = useMemo(() => {
    const tree = parseTree(debounced);
    if (!tree) return '';
    const positioned = layoutTree(tree, direction);
    return generateSVG(positioned, dark, direction);
  }, [debounced, dark, direction]);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.innerHTML = svgContent || '';
  }, [svgContent]);

  const exportSvg = () => {
    if (!svgContent) return;
    const d = new Date();
    const p = (n: number) => String(n).padStart(2, '0');
    const ts = `${d.getFullYear()}_${p(d.getMonth()+1)}_${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}_${p(d.getSeconds())}`;
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `logtree_${ts}.svg`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('SVGを保存しました');
  };

  return (
    <div className={`logtree ${dark ? 'dark' : 'light'}`}>
      <div className="lt-header">
        <div className="lt-logo-icon"><Network size={22} color="white" /></div>
        <h1><span className="accent">LogTree</span></h1>
      </div>

      <div className="lt-layout">
        {/* ===== LEFT: Input ===== */}
        <div className="lt-panel">
          <div className="lt-panel-title">インデントテキスト</div>

          <div className="lt-dir-toggle">
            {(['right', 'down'] as Direction[]).map(d => (
              <button
                key={d}
                className={`lt-btn lt-btn-ghost lt-btn-sm ${direction === d ? 'active' : ''}`}
                onClick={() => setDirection(d)}
              >
                {d === 'right' ? '→ 右向き' : '↓ 下向き'}
              </button>
            ))}
          </div>

          <textarea
            className="lt-code-area"
            value={text}
            onChange={e => setText(e.target.value)}
            rows={14}
            spellCheck={false}
            aria-label="ロジックツリー入力"
            placeholder={DEFAULT_TEXT}
          />

          <div className="lt-hint">
            <strong>書き方:</strong> 1行目がルート。<br />
            子ノードは 2 スペース（またはタブ）でインデント。<br />
            インデントを深くするほど具体化していく。
          </div>

          <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
            <button className="lt-btn lt-btn-ghost lt-btn-sm" onClick={() => setText(DEFAULT_TEXT)}>
              サンプルに戻す
            </button>
            {svgContent && (
              <button className="lt-btn lt-btn-ghost lt-btn-sm" onClick={exportSvg}>
                SVG 保存
              </button>
            )}
          </div>
        </div>

        {/* ===== RIGHT: Preview ===== */}
        <div className="lt-panel">
          <div className="lt-panel-title">プレビュー</div>
          {/* svgContent set via innerHTML to avoid React diff conflict */}
          {!svgContent && (
            <div className="lt-preview">
              <span className="lt-preview-empty">テキストを入力するとロジックツリーが表示されます</span>
            </div>
          )}
          <div ref={containerRef} className={svgContent ? 'lt-preview' : ''} />
        </div>
      </div>

      {toast && <div className="lt-toast">{toast}</div>}
    </div>
  );
};

export default LogTree;
