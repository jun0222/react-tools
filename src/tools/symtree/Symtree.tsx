import { useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import { Boxes } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import {
  BOXES,
  CONNECTIONS,
  boxWidthCh,
  boxRows,
  emptyTexts,
  exportJson,
  importJson,
  tickForConnection,
  arrowHeadPoints,
  sanitizeFileName,
  checkPassword,
  isAuthValid,
  nextAuthUntil,
  type BoxTexts,
} from './symtreeCore';
import './Symtree.css';

const SK_TEXTS = 'symtree-texts';
const SK_AUTH = 'symtree-auth-until';

const load = (): BoxTexts => {
  try {
    const raw = localStorage.getItem(SK_TEXTS);
    if (raw) {
      const parsed = importJson(raw);
      if (parsed) return parsed;
    }
  } catch { /* ignore */ }
  return emptyTexts();
};

const loadAuthed = (): boolean => {
  try {
    const raw = localStorage.getItem(SK_AUTH);
    return isAuthValid(raw ? Number(raw) : null, Date.now());
  } catch {
    return false;
  }
};

const BOX_MAP = Object.fromEntries(BOXES.map(b => [b.id, b]));

const Symtree = () => {
  const { dark } = useTheme();
  const [authed, setAuthed] = useState(loadAuthed);
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState(false);
  const [texts, setTexts] = useState<BoxTexts>(load);
  const [toast, setToast] = useState('');
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [pinnedId, setPinnedId] = useState<string | null>(null);
  const [fileName, setFileName] = useState('symtree');
  const activeId = pinnedId ?? hoverId;
  const canvasRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (checkPassword(passwordInput)) {
      localStorage.setItem(SK_AUTH, String(nextAuthUntil(Date.now())));
      setAuthed(true);
      setAuthError(false);
      setPasswordInput('');
    } else {
      setAuthError(true);
    }
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 1800);
  };

  const persist = (next: BoxTexts) => {
    setTexts(next);
    localStorage.setItem(SK_TEXTS, exportJson(next));
  };

  const updateText = (id: string, value: string) => {
    persist({ ...texts, [id]: value });
  };

  const handleReset = () => {
    persist(emptyTexts());
    showToast('リセットしました');
  };

  const handleExportJson = () => {
    const blob = new Blob([exportJson(texts)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement('a'), { href: url, download: `${sanitizeFileName(fileName)}.json` });
    a.click();
    URL.revokeObjectURL(url);
    showToast('JSONを保存しました');
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const imported = importJson(ev.target?.result as string);
      if (!imported) { showToast('インポートできませんでした'); return; }
      persist(imported);
      showToast('インポートしました');
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleExportPng = async () => {
    const el = canvasRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const prevWidth = el.style.width;
    const prevHeight = el.style.height;
    const prevMargin = el.style.margin;
    try {
      // Pin explicit pixel dimensions and zero out the centering margin so the
      // cloned node (rendered as its own root, with no real parent to auto-center
      // against) doesn't bake in a resolved "margin: auto" offset and get clipped.
      el.style.width = `${rect.width}px`;
      el.style.height = `${rect.height}px`;
      el.style.margin = '0';
      const url = await toPng(el, {
        backgroundColor: dark ? '#0d0d14' : '#f4f6fa',
        pixelRatio: 2,
        width: rect.width,
        height: rect.height,
      });
      const a = Object.assign(document.createElement('a'), { href: url, download: `${sanitizeFileName(fileName)}.png` });
      a.click();
      showToast('PNGを保存しました');
    } catch {
      showToast('PNG出力に失敗しました');
    } finally {
      el.style.width = prevWidth;
      el.style.height = prevHeight;
      el.style.margin = prevMargin;
    }
  };

  if (!authed) {
    return (
      <div className={`sym-root ${dark ? 'dark' : 'light'}`}>
        <div className="sym-lock-wrap">
          <form className="sym-lock-form" onSubmit={handleUnlock}>
            <div className="sym-logo"><Boxes size={20} color="white" /></div>
            <h1><span className="sym-accent">Symtree</span></h1>
            <p className="sym-lock-desc">閲覧にはパスワードが必要です</p>
            <input
              className="sym-lock-input"
              type="password"
              value={passwordInput}
              onChange={e => { setPasswordInput(e.target.value); setAuthError(false); }}
              aria-label="パスワード"
              placeholder="パスワード"
              autoFocus
            />
            {authError && <p className="sym-lock-error">パスワードが違います</p>}
            <button className="sym-btn sym-lock-submit" type="submit">解除</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className={`sym-root ${dark ? 'dark' : 'light'}`}>
      <div className="sym-header">
        <div className="sym-logo"><Boxes size={20} color="white" /></div>
        <h1><span className="sym-accent">Symtree</span></h1>
        <div className="sym-actions">
          <input
            className="sym-filename-input"
            value={fileName}
            onChange={e => setFileName(e.target.value)}
            aria-label="ファイル名"
            placeholder="symtree"
            spellCheck={false}
          />
          <button className="sym-btn" onClick={handleExportPng}>PNG</button>
          <button className="sym-btn" onClick={handleExportJson}>JSONエクスポート</button>
          <button className="sym-btn" onClick={() => fileInputRef.current?.click()}>JSONインポート</button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            className="sym-file-input"
            onChange={handleImportFile}
            aria-label="JSONファイルを選択"
          />
          <button className="sym-btn" onClick={handleReset}>リセット</button>
        </div>
      </div>

      <div className="sym-info-panel" role="status">
        {activeId ? (
          <>
            <strong className="sym-info-label">{BOX_MAP[activeId].label}</strong>
            <span className="sym-info-desc">{BOX_MAP[activeId].desc}</span>
          </>
        ) : (
          <span className="sym-info-hint">各項目にカーソルを合わせる、またはタップすると解説が表示されます</span>
        )}
      </div>

      <div className="sym-canvas-wrap">
        <div className="sym-canvas" ref={canvasRef} style={{ backgroundColor: dark ? '#0d0d14' : '#f4f6fa' }}>
          <svg className="sym-lines" viewBox="0 0 100 100" preserveAspectRatio="none">
            {CONNECTIONS.map(c => {
              const from = BOX_MAP[c.from];
              const to = BOX_MAP[c.to];
              const tick = c.arrow ? tickForConnection(from, to, 2) : null;
              const lineColor = dark ? '#555' : '#aaa';
              return (
                <g key={`${c.from}-${c.to}`}>
                  <line
                    x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                    stroke={lineColor} strokeWidth={1.2}
                  />
                  {c.arrow && (
                    <>
                      <polygon points={arrowHeadPoints(to, from, 9, 3, 1.6)} fill={lineColor} />
                      <polygon points={arrowHeadPoints(from, to, 9, 3, 1.6)} fill={lineColor} />
                    </>
                  )}
                  {tick && (
                    <line
                      x1={tick.x1} y1={tick.y1} x2={tick.x2} y2={tick.y2}
                      stroke={lineColor} strokeWidth={1.2}
                    />
                  )}
                </g>
              );
            })}
          </svg>

          {BOXES.map(b => (
            <div key={b.id} className="sym-box-anchor" style={{ left: `${b.x}%`, top: `${b.y}%` }}>
              <div
                className="sym-box-wrap"
                style={{ backgroundColor: b.bg, color: b.fg }}
                onMouseEnter={() => setHoverId(b.id)}
                onMouseLeave={() => setHoverId(prev => (prev === b.id ? null : prev))}
                onClick={() => setPinnedId(prev => (prev === b.id ? null : b.id))}
              >
                <div className="sym-box-label">{b.label}</div>
                <textarea
                  className="sym-box"
                  style={{ width: `${boxWidthCh(texts[b.id] ?? '')}ch`, color: b.fg }}
                  value={texts[b.id] ?? ''}
                  onChange={e => updateText(b.id, e.target.value)}
                  onFocus={() => setPinnedId(b.id)}
                  aria-label={b.label}
                  rows={boxRows(texts[b.id] ?? '')}
                  spellCheck={false}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {toast && <div className="sym-toast">{toast}</div>}
    </div>
  );
};

export default Symtree;