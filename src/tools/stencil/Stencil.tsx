import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { extractPlaceholders, applyTemplate } from './stencilCore';
import './Stencil.css';

const STORAGE_KEY = 'stencil-state';

const loadStorage = (): { template: string; values: Record<string, string> } => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { template: '', values: {} };
};

const Stencil = () => {
  const { dark } = useTheme();
  const saved = useMemo(loadStorage, []);
  const [template, setTemplate] = useState(saved.template);
  const [values, setValues] = useState<Record<string, string>>(saved.values);
  const [toast, setToast] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const placeholders = useMemo(() => extractPlaceholders(template), [template]);

  const output = useMemo(
    () => (template ? applyTemplate(template, values) : ''),
    [template, values]
  );

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ template, values }));
    } catch { /* ignore */ }
  }, [template, values]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 1800);
  }, []);

  const handleTemplateChange = (v: string) => {
    setTemplate(v);
    setValues(prev => {
      const next: Record<string, string> = {};
      for (const key of extractPlaceholders(v)) {
        next[key] = prev[key] ?? '';
      }
      return next;
    });
  };

  const handleClear = () => {
    setTemplate('');
    setValues({});
    localStorage.removeItem(STORAGE_KEY);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const text = ev.target?.result as string;
      handleTemplateChange(text);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const timestamp = () => {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}_${pad(d.getMonth() + 1)}_${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}_${pad(d.getSeconds())}`;
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(output);
      showToast('コピーしました');
    } catch {
      showToast('コピー失敗');
    }
  };

  const download = () => {
    const blob = new Blob([output], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stencil_${timestamp()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`stencil ${dark ? 'dark' : 'light'}`}>
      <header className="st-header">
        <div className="st-logo-icon">📋</div>
        <h1><span className="accent">Stencil</span></h1>
      </header>

      <div className="st-layout">
        {/* ===== LEFT: template input + variables ===== */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Template panel */}
          <div className="st-panel">
            <div className="st-panel-title">テンプレート</div>
            <div className="st-upload-row">
              <button
                className="st-btn st-btn-ghost st-btn-sm"
                onClick={() => fileInputRef.current?.click()}
              >
                📂 ファイルを開く
              </button>
              <input
                ref={fileInputRef}
                type="file"
                className="st-file-input"
                accept=".txt,.md,.html,.sql,.csv,text/*"
                onChange={handleFileUpload}
              />
              {(template || Object.values(values).some(v => v)) && (
                <button
                  className="st-btn st-btn-ghost st-btn-sm"
                  onClick={handleClear}
                >
                  クリア
                </button>
              )}
            </div>
            <textarea
              className="st-textarea"
              placeholder={'%%PLACEHOLDER%%形式の変数を埋め込んだテンプレートを入力するか、ファイルを開いてください。\n\n例:\n## %%タイトル%%\n\n%%本文%%\n\n---\n作成者: %%著者%%'}
              value={template}
              onChange={e => handleTemplateChange(e.target.value)}
              rows={12}
              aria-label="テンプレート入力"
            />
          </div>

          {/* Variables panel */}
          <div className="st-panel">
            <div className="st-panel-title">変数 ({placeholders.length})</div>
            {placeholders.length === 0 ? (
              <p className="st-empty-hint">%%KEY%%形式の変数がテンプレートに見つかると、ここに入力欄が表示されます。</p>
            ) : (
              <div className="st-vars">
                {placeholders.map(key => (
                  <div key={key} className="st-var-row">
                    <label className="st-var-label" htmlFor={`var-${key}`}>{key}</label>
                    <textarea
                      id={`var-${key}`}
                      className="st-var-input"
                      placeholder={`%%${key}%% の値`}
                      value={values[key] ?? ''}
                      onChange={e => setValues(prev => ({ ...prev, [key]: e.target.value }))}
                      rows={2}
                      aria-label={key}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ===== RIGHT: output ===== */}
        <div className="st-panel">
          <div className="st-output-header">
            <div className="st-panel-title">プレビュー</div>
            {output && (
              <div style={{ display: 'flex', gap: '6px' }}>
                <button className="st-btn st-btn-ghost st-btn-sm" onClick={copy}>
                  コピー
                </button>
                <button className="st-btn st-btn-primary st-btn-sm" onClick={download}>
                  DL
                </button>
              </div>
            )}
          </div>
          <div className={`st-output-box${!output ? ' empty' : ''}`} aria-label="変換結果">
            {output || 'テンプレートを入力すると、変換結果がここに表示されます。'}
          </div>
        </div>
      </div>

      {toast && <div className="st-toast">{toast}</div>}
    </div>
  );
};

export default Stencil;