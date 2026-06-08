import { useState, useEffect, useRef, useCallback } from 'react';
import mermaid from 'mermaid';
import { CalendarDays } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import './Gantt.css';

const STORAGE_KEY = 'gantt-code';

const DEFAULT_CODE = `gantt
    title プロジェクト計画
    dateFormat YYYY-MM-DD
    section 設計フェーズ
        要件定義 :2024-01-01, 5d
        アーキテクチャ設計 :crit, 2024-01-06, 3d
    section 開発フェーズ
        バックエンド実装 :2024-01-09, 10d
        フロントエンド実装 :2024-01-09, 10d
    section テスト
        統合テスト :2024-01-19, 5d`;

const CHEATSHEET = [
  ['基本構造', 'gantt\n    title タイトル\n    dateFormat YYYY-MM-DD'],
  ['セクション', '    section フェーズ名'],
  ['タスク', '    タスク名 :開始日, 期間'],
  ['クリティカル', '    タスク名 :crit, 開始日, 期間'],
  ['完了済み', '    タスク名 :done, 開始日, 終了日'],
  ['アクティブ', '    タスク名 :active, 開始日, 期間'],
  ['期間例', '3d / 1w / 2023-01-10 (終了日)'],
];

let renderSeq = 0;

const Gantt = () => {
  const { dark } = useTheme();
  const [code, setCode] = useState(() => localStorage.getItem(STORAGE_KEY) ?? DEFAULT_CODE);
  const [hasSvg, setHasSvg] = useState(false);
  const [toast, setToast] = useState('');
  const previewRef = useRef<HTMLDivElement>(null);
  const svgCache = useRef('');
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => { localStorage.setItem(STORAGE_KEY, code); }, [code]);

  const showToast = useCallback((msg: string) => {
    setToast(msg); setTimeout(() => setToast(''), 1800);
  }, []);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (!previewRef.current) return;
      if (!code.trim()) {
        previewRef.current.innerHTML = '';
        svgCache.current = '';
        setHasSvg(false);
        return;
      }
      const id = `gantt-svg-${++renderSeq}`;
      mermaid.initialize({ startOnLoad: false, theme: dark ? 'dark' : 'default' });
      mermaid.render(id, code)
        .then(({ svg }) => {
          if (previewRef.current) {
            previewRef.current.innerHTML = svg;
            svgCache.current = svg;
            setHasSvg(true);
          }
        })
        .catch(() => {
          if (previewRef.current) {
            previewRef.current.innerHTML = '<span style="color:#f87171;font-size:12px;padding:8px;display:block">Syntax error</span>';
            svgCache.current = '';
            setHasSvg(false);
          }
        });
    }, 400);
    return () => clearTimeout(debounceRef.current);
  }, [code, dark]);

  const exportSvg = () => {
    const svg = svgCache.current; if (!svg) return;
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: 'gantt.svg' });
    a.click(); URL.revokeObjectURL(a.href);
    showToast('SVGを保存しました');
  };

  const exportPng = useCallback(() => {
    const svg = svgCache.current; if (!svg) return;
    const wm = svg.match(/width="(\d+(?:\.\d+)?)"/), hm = svg.match(/height="(\d+(?:\.\d+)?)"/);
    const w = wm ? parseFloat(wm[1]) : 900, h = hm ? parseFloat(hm[1]) : 400, scale = 2;
    const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }));
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = w * scale; canvas.height = h * scale;
      const ctx = canvas.getContext('2d'); if (!ctx) return;
      ctx.scale(scale, scale); ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      canvas.toBlob(blob => {
        if (!blob) return;
        const pu = URL.createObjectURL(blob);
        const a = Object.assign(document.createElement('a'), { href: pu, download: 'gantt.png' });
        a.click(); URL.revokeObjectURL(pu);
        showToast('PNGを保存しました');
      }, 'image/png');
    };
    img.src = url;
  }, [showToast]);

  return (
    <div className={`gantt-root ${dark ? 'dark' : 'light'}`}>
      <div className="gt-header">
        <div className="gt-logo-icon"><CalendarDays size={20} color="white" /></div>
        <h1><span className="gt-accent">Gantt</span> Chart</h1>
        <div className="gt-header-actions">
          {hasSvg && <>
            <button className="gt-btn gt-btn-ghost" onClick={exportSvg}>SVG</button>
            <button className="gt-btn gt-btn-ghost" onClick={exportPng}>PNG</button>
          </>}
          <button className="gt-btn gt-btn-ghost" onClick={() => { navigator.clipboard.writeText(code); showToast('コピーしました'); }}>コード コピー</button>
          <button className="gt-btn gt-btn-ghost" onClick={() => { setCode(DEFAULT_CODE); showToast('リセットしました'); }}>リセット</button>
        </div>
      </div>

      <div className="gt-body">
        {/* Left: editor */}
        <div className="gt-editor-col">
          <textarea
            className="gt-textarea"
            value={code}
            onChange={e => setCode(e.target.value)}
            spellCheck={false}
            placeholder="ganttコードを入力..."
          />
          <div className="gt-cheatsheet">
            <div className="gt-cheat-title">カンペ</div>
            {CHEATSHEET.map(([label, val]) => (
              <div key={label} className="gt-cheat-row">
                <span className="gt-cheat-label">{label}</span>
                <code className="gt-cheat-val">{val}</code>
              </div>
            ))}
          </div>
        </div>

        {/* Right: preview */}
        <div className="gt-preview-col">
          {!hasSvg && <div className="gt-preview-empty">ガントチャートがここに表示されます</div>}
          <div ref={previewRef} className="gt-preview-inner" />
        </div>
      </div>

      {toast && <div className="gt-toast">{toast}</div>}
    </div>
  );
};

export default Gantt;
