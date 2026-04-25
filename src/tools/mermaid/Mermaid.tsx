import { useState, useEffect, useRef, useCallback } from 'react';
import mermaid from 'mermaid';
import { useTheme } from '../../context/ThemeContext';
import { TEMPLATES } from './templates';
import './Mermaid.css';

let renderSeq = 0;

const Mermaid = () => {
  const { dark } = useTheme();
  const [activeId, setActiveId] = useState(TEMPLATES[0].id);
  const [code, setCode] = useState(TEMPLATES[0].code);
  const [error, setError] = useState<string | null>(null);
  const [hintsOpen, setHintsOpen] = useState(true);
  const [toast, setToast] = useState('');
  const previewRef = useRef<HTMLDivElement>(null);

  // debounced code for rendering
  const [debouncedCode, setDebouncedCode] = useState(code);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedCode(code), 400);
    return () => clearTimeout(t);
  }, [code]);

  useEffect(() => {
    if (!previewRef.current) return;
    if (!debouncedCode.trim()) {
      previewRef.current.innerHTML = '';
      setError(null);
      return;
    }
    const id = `mm-svg-${++renderSeq}`;
    mermaid.initialize({ startOnLoad: false, theme: dark ? 'dark' : 'default' });
    mermaid.render(id, debouncedCode)
      .then(({ svg }) => {
        if (previewRef.current) previewRef.current.innerHTML = svg;
        setError(null);
      })
      .catch((e: unknown) => {
        const msg = e instanceof Error ? e.message : String(e);
        setError(msg.slice(0, 200));
        if (previewRef.current) previewRef.current.innerHTML = '';
      });
  }, [debouncedCode, dark]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 1800);
  }, []);

  const handleTemplateSelect = (id: string) => {
    setActiveId(id);
    const tpl = TEMPLATES.find(t => t.id === id);
    if (tpl) setCode(tpl.code);
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      showToast('コードをコピーしました');
    } catch {
      showToast('コピー失敗');
    }
  };

  const activeTemplate = TEMPLATES.find(t => t.id === activeId) ?? TEMPLATES[0];

  return (
    <div className={`mm-root ${dark ? 'dark' : 'light'}`}>
      <header className="mm-header">
        <div className="mm-logo-icon">📊</div>
        <h1><span className="accent">Mermaid</span> Editor</h1>
      </header>

      {/* ===== TEMPLATE TABS ===== */}
      <div className="mm-template-tabs" role="tablist">
        {TEMPLATES.map(t => (
          <button
            key={t.id}
            role="tab"
            aria-selected={activeId === t.id}
            className={`mm-tab ${activeId === t.id ? 'mm-tab-active' : ''}`}
            onClick={() => handleTemplateSelect(t.id)}
          >
            {t.label}
          </button>
        ))}
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
              onClick={() => handleTemplateSelect(activeId)}
              title="テンプレートに戻す"
            >
              リセット
            </button>
          </div>
        </div>

        {/* Preview */}
        <div className="mm-preview-pane">
          <span className="mm-editor-label">プレビュー</span>
          <div className="mm-preview-box">
            {error && <div className="mm-preview-error">⚠ 構文エラー<br />{error}</div>}
            {!error && !debouncedCode.trim() && (
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
