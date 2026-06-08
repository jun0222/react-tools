import { useState, useEffect, useRef, useCallback } from 'react';
import mermaid from 'mermaid';
import { Fish } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import './Fishbone.css';

const STORAGE_KEY = 'fishbone-code';

const DEFAULT_CODE = `ishikawa
    "ソフトウェアリリース遅延"
        "人 (Man)"
            "経験不足"
            "スキルギャップ"
        "方法 (Method)"
            "プロセス未整備"
            "レビュー不足"
        "機械 (Machine)"
            "ツール不足"
            "環境設定の問題"
        "材料 (Material)"
            "品質のばらつき"
            "ドキュメント不足"`;

const CHEATSHEET = [
  ['基本構造', 'ishikawa\n    "効果・問題"\n        "カテゴリ"\n            "原因"'],
  ['カテゴリ', '        "人 / 方法 / 機械 / 材料"'],
  ['原因', '            "具体的な原因"'],
  ['ネスト', '深さは自由に増やせる'],
  ['引用符', '名前はダブルクォートで囲む'],
];

let renderSeq = 0;

const Fishbone = () => {
  const { dark } = useTheme();
  const [code, setCode] = useState(() => localStorage.getItem(STORAGE_KEY) ?? DEFAULT_CODE);
  const [hasSvg, setHasSvg] = useState(false);
  const [toast, setToast] = useState('');
  const previewRef = useRef<HTMLDivElement>(null);
  const svgCache = useRef('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

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
      const id = `fb-svg-${++renderSeq}`;
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
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: 'fishbone.svg' });
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
        const a = Object.assign(document.createElement('a'), { href: pu, download: 'fishbone.png' });
        a.click(); URL.revokeObjectURL(pu);
        showToast('PNGを保存しました');
      }, 'image/png');
    };
    img.src = url;
  }, [showToast]);

  return (
    <div className={`fishbone-root ${dark ? 'dark' : 'light'}`}>
      <div className="fb-header">
        <div className="fb-logo-icon"><Fish size={20} color="white" /></div>
        <h1><span className="fb-accent">Fishbone</span> 特性要因図</h1>
        <div className="fb-header-actions">
          {hasSvg && <>
            <button className="fb-btn fb-btn-ghost" onClick={exportSvg}>SVG</button>
            <button className="fb-btn fb-btn-ghost" onClick={exportPng}>PNG</button>
          </>}
          <button className="fb-btn fb-btn-ghost" onClick={() => { navigator.clipboard.writeText(code); showToast('コピーしました'); }}>コード コピー</button>
          <button className="fb-btn fb-btn-ghost" onClick={() => { setCode(DEFAULT_CODE); showToast('リセットしました'); }}>リセット</button>
        </div>
      </div>

      <div className="fb-body">
        {/* Left: editor */}
        <div className="fb-editor-col">
          <textarea
            className="fb-textarea"
            value={code}
            onChange={e => setCode(e.target.value)}
            spellCheck={false}
            placeholder="ishikawaコードを入力..."
          />
          <div className="fb-cheatsheet">
            <div className="fb-cheat-title">カンペ</div>
            {CHEATSHEET.map(([label, val]) => (
              <div key={label} className="fb-cheat-row">
                <span className="fb-cheat-label">{label}</span>
                <code className="fb-cheat-val">{val}</code>
              </div>
            ))}
          </div>
        </div>

        {/* Right: preview */}
        <div className="fb-preview-col">
          {!hasSvg && <div className="fb-preview-empty">フィッシュボーン図がここに表示されます</div>}
          <div ref={previewRef} className="fb-preview-inner" />
        </div>
      </div>

      {toast && <div className="fb-toast">{toast}</div>}
    </div>
  );
};

export default Fishbone;
