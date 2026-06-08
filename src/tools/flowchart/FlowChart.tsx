import { useState, useCallback, useMemo } from 'react';
import { GitFork } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { parseFlowDSL, renderFlowSVG } from './flowchartCore';
import './FlowChart.css';

const STORAGE_KEY = 'flowchart-code';

const DEFAULT_CODE = `# シンプルなフロー図 — 書き方: NodeA -> NodeB : ラベル(任意)
# 色指定: NodeName [blue|green|red|orange|purple|cyan]

START [green]
完了 [green]
判断? [orange]
修正 [red]

START -> 要件定義
要件定義 -> 設計 : 承認
設計 -> 実装
実装 -> テスト
テスト -> 判断?
判断? -> 完了 : PASS
判断? -> 修正 : FAIL
修正 -> 実装`;

const CHEATSHEET = [
  ['接続', 'A -> B'],
  ['ラベル付き', 'A -> B : ラベル'],
  ['色指定', 'NodeName [blue]'],
  ['インライン色', 'A[red] -> B[green]'],
  ['コメント', '# これはコメント'],
  ['使える色', 'blue / green / red / orange / purple / cyan'],
];

const FlowChart = () => {
  const { dark } = useTheme();
  const [code, setCode] = useState(() => localStorage.getItem(STORAGE_KEY) ?? DEFAULT_CODE);
  const [toast, setToast] = useState('');

  const parsed = useMemo(() => parseFlowDSL(code), [code]);
  const svg    = useMemo(() => renderFlowSVG(parsed, dark), [parsed, dark]);

  const showToast = useCallback((msg: string) => {
    setToast(msg); setTimeout(() => setToast(''), 1800);
  }, []);

  const handleChange = (v: string) => {
    setCode(v);
    localStorage.setItem(STORAGE_KEY, v);
  };

  const exportSvg = () => {
    if (!svg) return;
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: 'flowchart.svg' });
    a.click(); URL.revokeObjectURL(a.href);
    showToast('SVGを保存しました');
  };

  const exportPng = useCallback(() => {
    if (!svg) return;
    const wm = svg.match(/width="([\d.]+)"/), hm = svg.match(/height="([\d.]+)"/);
    const w = wm ? parseFloat(wm[1]) : 600, h = hm ? parseFloat(hm[1]) : 400, scale = 2;
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
        const a = Object.assign(document.createElement('a'), { href: pu, download: 'flowchart.png' });
        a.click(); URL.revokeObjectURL(pu);
        showToast('PNGを保存しました');
      }, 'image/png');
    };
    img.src = url;
  }, [svg, showToast]);

  const openInTab = () => {
    if (!svg) return;
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    window.open(URL.createObjectURL(blob), '_blank');
  };

  return (
    <div className={`fc-root ${dark ? 'dark' : 'light'}`}>
      <div className="fc-header">
        <div className="fc-logo-icon"><GitFork size={20} color="white" /></div>
        <h1><span className="fc-accent">FlowChart</span></h1>
        <div className="fc-header-actions">
          {svg && <>
            <button className="fc-btn fc-btn-ghost" onClick={openInTab}>別タブ</button>
            <button className="fc-btn fc-btn-ghost" onClick={exportSvg}>SVG</button>
            <button className="fc-btn fc-btn-ghost" onClick={exportPng}>PNG</button>
          </>}
          <button className="fc-btn fc-btn-ghost" onClick={() => { handleChange(DEFAULT_CODE); showToast('リセット'); }}>リセット</button>
        </div>
      </div>

      <div className="fc-body">
        {/* Editor */}
        <div className="fc-editor-col">
          <textarea
            className="fc-textarea"
            value={code}
            onChange={e => handleChange(e.target.value)}
            spellCheck={false}
            placeholder="A -> B : ラベル"
          />
          <div className="fc-cheatsheet">
            <div className="fc-cheat-title">書き方</div>
            {CHEATSHEET.map(([label, val]) => (
              <div key={label} className="fc-cheat-row">
                <span className="fc-cheat-label">{label}</span>
                <code className="fc-cheat-val">{val}</code>
              </div>
            ))}
          </div>
        </div>

        {/* Preview */}
        <div className="fc-preview-col">
          {!svg && <div className="fc-preview-empty">フロー図がここに表示されます</div>}
          {svg && <div className="fc-preview-inner" dangerouslySetInnerHTML={{ __html: svg }} />}
        </div>
      </div>

      {toast && <div className="fc-toast">{toast}</div>}
    </div>
  );
};

export default FlowChart;
