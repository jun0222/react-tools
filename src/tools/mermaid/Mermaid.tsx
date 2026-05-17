import { useState, useEffect, useRef, useCallback } from 'react';
import mermaid from 'mermaid';
import { useTheme } from '../../context/ThemeContext';
import { BarChart3 } from 'lucide-react';
import { TEMPLATES } from './templates';
import './Mermaid.css';

let renderSeq = 0;

const STORAGE_KEY = 'mermaid-saved-codes';

const loadSaved = (): Record<string, string> => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const getSvgContent = (el: HTMLDivElement | null): string =>
  el?.querySelector('svg')?.outerHTML ?? '';

const Mermaid = () => {
  const { dark } = useTheme();

  const [saved, setSaved] = useState<Record<string, string>>(loadSaved);
  const [activeId, setActiveId] = useState(TEMPLATES[0].id);
  const [code, setCode] = useState(() => {
    const s = loadSaved();
    return s[TEMPLATES[0].id] ?? TEMPLATES[0].code;
  });
  const [hasSvg, setHasSvg] = useState(false);
  const [hintsOpen, setHintsOpen] = useState(true);
  const [toast, setToast] = useState('');
  const previewRef = useRef<HTMLDivElement>(null);

  const [debouncedCode, setDebouncedCode] = useState(code);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedCode(code), 400);
    return () => clearTimeout(t);
  }, [code]);

  useEffect(() => {
    setSaved(prev => {
      const next = { ...prev, [activeId]: code };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, [code, activeId]);

  useEffect(() => {
    if (!previewRef.current) return;
    if (!debouncedCode.trim()) {
      previewRef.current.innerHTML = '';
      setHasSvg(false);
      return;
    }
    const id = `mm-svg-${++renderSeq}`;
    mermaid.initialize({ startOnLoad: false, theme: dark ? 'dark' : 'default' });
    mermaid.render(id, debouncedCode)
      .then(({ svg }) => {
        if (previewRef.current) previewRef.current.innerHTML = svg;
        setHasSvg(true);
      })
      .catch(() => {
        // keep last good SVG on error — no error display
      });
  }, [debouncedCode, dark]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 1800);
  }, []);

  const handleTemplateSelect = (id: string) => {
    setActiveId(id);
    const tpl = TEMPLATES.find(t => t.id === id);
    if (!tpl) return;
    setCode(saved[id] ?? tpl.code);
  };

  const resetCode = () => {
    const tpl = TEMPLATES.find(t => t.id === activeId);
    if (tpl) setCode(tpl.code);
  };

  const codeRef = useRef(code);
  useEffect(() => { codeRef.current = code; }, [code]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        const text = codeRef.current;
        if (!text) return;
        navigator.clipboard.writeText(text).then(
          () => showToast('コードをコピーしました'),
          () => showToast('コピー失敗'),
        );
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [showToast]);

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      showToast('コードをコピーしました');
    } catch {
      showToast('コピー失敗');
    }
  };

  const timestamp = () => {
    const d = new Date();
    const pad = (n: number, len = 2) => String(n).padStart(len, '0');
    return `${d.getFullYear()}_${pad(d.getMonth() + 1)}_${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}_${pad(d.getSeconds())}`;
  };

  const exportSvg = () => {
    const svg = getSvgContent(previewRef.current);
    if (!svg) return;
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeId}_${timestamp()}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const openFullscreen = () => {
    const svg = getSvgContent(previewRef.current);
    if (!svg) return;
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  const activeTemplate = TEMPLATES.find(t => t.id === activeId) ?? TEMPLATES[0];
  const isDirty = code !== (TEMPLATES.find(t => t.id === activeId)?.code ?? '');

  return (
    <div className={`mm-root ${dark ? 'dark' : 'light'}`}>
      <header className="mm-header">
        <div className="mm-logo-icon"><BarChart3 size={22} color="white" /></div>
        <h1><span className="accent">Mermaid</span> Editor</h1>
      </header>

      {/* ===== TEMPLATE TABS ===== */}
      <div className="mm-template-tabs" role="tablist">
        {TEMPLATES.map(t => {
          const modified = (saved[t.id] ?? t.code) !== t.code;
          return (
            <button
              key={t.id}
              role="tab"
              aria-selected={activeId === t.id}
              className={`mm-tab ${activeId === t.id ? 'mm-tab-active' : ''}`}
              onClick={() => handleTemplateSelect(t.id)}
            >
              {t.label}
              {modified && <span className="mm-tab-dot" title="編集済み" />}
            </button>
          );
        })}
      </div>

      {/* ===== SPLIT PANE ===== */}
      <div className="mm-split">
        {/* Editor */}
        <div className="mm-editor-pane">
          <span className="mm-editor-label">コード</span>
          <textarea
            className="mm-textarea"
            value={code}
            onChange={e => setCode(e.target.value)}
            spellCheck={false}
            aria-label="Mermaidコード入力"
          />
          <div className="mm-editor-actions">
            <button className="mm-btn mm-btn-accent" onClick={copyCode}>
              コードをコピー
            </button>
            <button
              className="mm-btn mm-btn-ghost"
              onClick={resetCode}
              disabled={!isDirty}
              title="テンプレートに戻す"
            >
              リセット
            </button>
          </div>
        </div>

        {/* Preview */}
        <div className="mm-preview-pane">
          <div className="mm-preview-label-row">
            <span className="mm-editor-label">プレビュー</span>
            {hasSvg && (
              <div className="mm-preview-actions">
                <button className="mm-btn mm-btn-ghost mm-btn-sm" onClick={exportSvg} title="SVGをダウンロード">
                  SVG 保存
                </button>
                <button className="mm-btn mm-btn-ghost mm-btn-sm" onClick={openFullscreen} title="全画面で開く">
                  全画面
                </button>
              </div>
            )}
          </div>
          <div className="mm-preview-box">
            {!hasSvg && !debouncedCode.trim() && (
              <span className="mm-preview-empty">コードを入力するとここに表示されます</span>
            )}
            <div ref={previewRef} />
          </div>
        </div>
      </div>

      {/* ===== カンペ ===== */}
      <div className="mm-hints-toggle">
        <div className="mm-hints-header" onClick={() => setHintsOpen(v => !v)}>
          <span className="mm-hints-title">カンペ — {activeTemplate.label} の構文</span>
          <span className={`mm-hints-chevron ${hintsOpen ? 'open' : ''}`}>▼</span>
        </div>
        {hintsOpen && (
          <div className="mm-hints-body">
            {activeTemplate.hints.map((h, i) => (
              <div
                key={i}
                className="mm-hint-row mm-hint-row--clickable"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(h.syntax);
                    showToast('カンペをコピーしました');
                  } catch {
                    showToast('コピー失敗');
                  }
                }}
                title="クリックでコピー"
              >
                <span className="mm-hint-syntax">{h.syntax}</span>
                <span className="mm-hint-desc">{h.desc}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {toast && <div className="mm-toast">{toast}</div>}
    </div>
  );
};

export default Mermaid;