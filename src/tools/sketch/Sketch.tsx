import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import mermaid from 'mermaid';
import { PenTool } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import {
  type DiagramType,
  DIAGRAM_CONFIGS,
  FLOW_DEFAULT,
  STATE_DEFAULT,
  GRAPH_DEFAULT,
  generateFilename,
  parseSimpleNotation,
} from './sketchCore';
import './Sketch.css';

let sketchRenderSeq = 0;
const STORAGE_KEY = 'sketch-state';

const loadCodes = (): Record<DiagramType, string> => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Record<DiagramType, string>;
  } catch { /* ignore */ }
  return { flow: FLOW_DEFAULT, state: STATE_DEFAULT, graph: GRAPH_DEFAULT };
};

const Sketch = () => {
  const { dark } = useTheme();
  const [activeType, setActiveType] = useState<DiagramType>('flow');
  const [codes, setCodes] = useState<Record<DiagramType, string>>(loadCodes);
  const [debouncedCode, setDebouncedCode] = useState(codes[activeType]);
  const [hasSvg, setHasSvg] = useState(false);
  const [toast, setToast] = useState('');
  const previewRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const currentCode = codes[activeType];
  const config = DIAGRAM_CONFIGS[activeType];

  // Convert simple notation → Mermaid (debounced)
  const generatedMermaid = useMemo(
    () => parseSimpleNotation(debouncedCode, activeType),
    [debouncedCode, activeType],
  );

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(codes));
    } catch { /* ignore */ }
  }, [codes]);

  useEffect(() => { setHasSvg(false); }, [activeType]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedCode(currentCode), 400);
    return () => clearTimeout(t);
  }, [currentCode]);

  useEffect(() => {
    if (!previewRef.current) return;
    if (!debouncedCode.trim()) {
      previewRef.current.innerHTML = '';
      setHasSvg(false);
      return;
    }
    const id = `sk-svg-${++sketchRenderSeq}`;
    mermaid.initialize({ startOnLoad: false, theme: dark ? 'dark' : 'default' });
    mermaid.render(id, generatedMermaid)
      .then(({ svg }) => {
        if (previewRef.current) {
          previewRef.current.innerHTML = svg;
          setHasSvg(true);
        }
      })
      .catch(() => { setHasSvg(false); });
  }, [generatedMermaid, dark]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 1800);
  }, []);

  const setCode = (code: string) =>
    setCodes(prev => ({ ...prev, [activeType]: code }));

  const insertSnippet = (snippetCode: string) => {
    const ta = textareaRef.current;
    if (!ta) { setCode(currentCode + '\n' + snippetCode); return; }
    const pos = ta.selectionStart ?? currentCode.length;
    const newCode = currentCode.slice(0, pos) + '\n' + snippetCode + currentCode.slice(pos);
    setCode(newCode);
    requestAnimationFrame(() => {
      ta.focus();
      ta.selectionStart = ta.selectionEnd = pos + snippetCode.length + 1;
    });
  };

  const exportSvg = () => {
    const svgEl = previewRef.current?.querySelector('svg');
    if (!svgEl) return;
    const svgString = new XMLSerializer().serializeToString(svgEl);
    const blob = new Blob([svgString], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = generateFilename('svg');
    a.click();
    URL.revokeObjectURL(url);
    showToast('SVGを保存しました');
  };

  const exportPng = async () => {
    const svgEl = previewRef.current?.querySelector('svg');
    if (!svgEl) return;
    const { width, height } = svgEl.getBoundingClientRect();
    if (width === 0 || height === 0) { showToast('サイズ取得失敗'); return; }
    const clone = svgEl.cloneNode(true) as SVGElement;
    clone.setAttribute('width', String(width));
    clone.setAttribute('height', String(height));
    const svgString = new XMLSerializer().serializeToString(clone);
    const scale = 2;
    try {
      const img = await new Promise<HTMLImageElement>((res, rej) => {
        const i = new Image();
        i.onload = () => res(i);
        i.onerror = () => rej(new Error('load failed'));
        i.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgString);
      });
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(width * scale);
      canvas.height = Math.round(height * scale);
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = dark ? '#1a1a24' : '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.scale(scale, scale);
      ctx.drawImage(img, 0, 0);
      canvas.toBlob(blob => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = generateFilename('png');
        a.click();
        URL.revokeObjectURL(url);
        showToast('PNGを保存しました（2x）');
      }, 'image/png');
    } catch {
      showToast('エクスポート失敗');
    }
  };

  return (
    <div className={`sketch-tool ${dark ? 'dark' : 'light'}`}>
      <div className="sk-header">
        <div className="sk-logo-icon"><PenTool size={22} color="white" /></div>
        <h1><span className="accent">Sketch</span></h1>
      </div>

      <div className="sk-type-bar">
        {(Object.keys(DIAGRAM_CONFIGS) as DiagramType[]).map(t => (
          <button
            key={t}
            className={`sk-type-btn ${activeType === t ? 'sk-type-btn-active' : ''}`}
            onClick={() => setActiveType(t)}
          >
            {DIAGRAM_CONFIGS[t].name}
          </button>
        ))}
      </div>

      <div className="sk-layout">
        {/* ===== EDITOR ===== */}
        <div className="sk-panel">
          <div className="sk-snippets-bar">
            {config.snippets.map(s => (
              <button
                key={s.label}
                className="sk-snippet-btn"
                onClick={() => insertSnippet(s.code)}
                title={s.desc}
              >
                {s.label}
              </button>
            ))}
            <button
              className="sk-snippet-btn sk-snippet-reset"
              onClick={() => setCode(config.defaultCode)}
              title="デフォルトに戻す"
            >
              リセット
            </button>
          </div>

          <textarea
            ref={textareaRef}
            className="sk-code-area"
            value={currentCode}
            onChange={e => setCode(e.target.value)}
            spellCheck={false}
            rows={16}
            aria-label="ダイアグラム記法"
            placeholder={`例:\nあれ → それ ← これ\n{判断} →[はい] 処理A\n{判断} →[いいえ] 処理B`}
          />

          {/* Generated Mermaid toggle */}
          <details className="sk-generated-details">
            <summary className="sk-generated-summary">生成されたMermaidコード</summary>
            <pre className="sk-generated-code">{generatedMermaid}</pre>
          </details>
        </div>

        {/* ===== PREVIEW ===== */}
        <div className="sk-panel sk-preview-panel">
          <div className="sk-export-row">
            <span className="sk-export-label">エクスポート</span>
            <button
              className={`sk-export-btn ${!hasSvg ? 'disabled' : ''}`}
              onClick={exportSvg}
              disabled={!hasSvg}
            >
              SVG
            </button>
            <button
              className={`sk-export-btn ${!hasSvg ? 'disabled' : ''}`}
              onClick={exportPng}
              disabled={!hasSvg}
            >
              PNG ×2
            </button>
          </div>
          {!hasSvg && (
            <div className="sk-preview-empty">
              コードを入力するとここに表示されます
            </div>
          )}
          <div ref={previewRef} className={hasSvg ? 'sk-preview-box' : ''} />
        </div>
      </div>

      {toast && <div className="sk-toast">{toast}</div>}
    </div>
  );
};

export default Sketch;
