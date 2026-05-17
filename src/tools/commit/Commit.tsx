import { useState, useRef, useCallback } from 'react';
import { GitCommit, Clipboard, Download, Upload } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import {
  formatCommit,
  addToHistory,
  exportHistoryJson,
  importHistoryJson,
  type CommitHistory,
} from './commitCore';
import './Commit.css';

const STORAGE_KEY = 'commit-history-v1';

const PRESET_TYPES = ['feat', 'fix', 'chore', 'docs', 'refactor', 'test', 'style', 'perf', 'ci'];

const loadHistory = (): CommitHistory => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        types:  Array.isArray(parsed.types)  ? parsed.types  : [],
        scopes: Array.isArray(parsed.scopes) ? parsed.scopes : [],
        descs:  Array.isArray(parsed.descs)  ? parsed.descs  : [],
      };
    }
  } catch { /* ignore */ }
  return { types: [], scopes: [], descs: [] };
};

const saveHistory = (h: CommitHistory) => {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(h)); } catch { /* ignore */ }
};

const Commit = () => {
  const { dark } = useTheme();
  const [type,  setType]  = useState('');
  const [scope, setScope] = useState('');
  const [desc,  setDesc]  = useState('');
  const [history, setHistory] = useState<CommitHistory>(loadHistory);
  const [toast, setToast] = useState('');
  const importRef = useRef<HTMLInputElement>(null);

  const message = formatCommit(type, scope, desc);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 1800);
  }, []);

  const commit = async () => {
    if (!message) return;
    const next: CommitHistory = {
      types:  addToHistory(history.types,  type),
      scopes: scope.trim() ? addToHistory(history.scopes, scope) : history.scopes,
      descs:  addToHistory(history.descs,  desc),
    };
    setHistory(next);
    saveHistory(next);
    try {
      await navigator.clipboard.writeText(message);
      showToast('コピーしました');
    } catch {
      showToast('コピー失敗');
    }
  };

  const handleExport = () => {
    const json = exportHistoryJson(history.types, history.scopes, history.descs);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'commit-history.json';
    a.click();
    URL.revokeObjectURL(url);
    showToast('エクスポートしました');
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const result = importHistoryJson(ev.target?.result as string);
      if (!result) { showToast('読み込み失敗'); return; }
      const mergedClean: CommitHistory = {
        types:  [...new Set([...result.types,  ...history.types])].slice(0, 20),
        scopes: [...new Set([...result.scopes, ...history.scopes])].slice(0, 20),
        descs:  [...new Set([...result.descs,  ...history.descs])].slice(0, 20),
      };
      setHistory(mergedClean);
      saveHistory(mergedClean);
      showToast('インポートしました');
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const pick = (field: 'type' | 'scope' | 'desc', val: string) => {
    if (field === 'type')  setType(val);
    if (field === 'scope') setScope(val);
    if (field === 'desc')  setDesc(val);
  };

  return (
    <div className={`commit-tool ${dark ? 'dark' : 'light'}`}>
      <div className="cm-header">
        <div className="cm-logo"><GitCommit size={22} color="white" /></div>
        <div>
          <h1>Commit <span className="cm-accent">Message</span></h1>
          <p className="cm-sub">type(scope): description</p>
        </div>
      </div>

      {/* ===== 入力エリア ===== */}
      <div className="cm-form">
        <div className="cm-field">
          <label className="cm-label">type</label>
          <input
            className="cm-input"
            value={type}
            onChange={e => setType(e.target.value)}
            placeholder="feat"
            aria-label="type"
          />
          <div className="cm-presets">
            {PRESET_TYPES.map(p => (
              <button key={p} className={`cm-chip ${type === p ? 'cm-chip-active' : ''}`} onClick={() => setType(p)}>
                {p}
              </button>
            ))}
          </div>
        </div>

        <div className="cm-paren cm-dim">(</div>

        <div className="cm-field">
          <label className="cm-label">scope <span className="cm-dim">任意</span></label>
          <input
            className="cm-input"
            value={scope}
            onChange={e => setScope(e.target.value)}
            placeholder="auth"
            aria-label="scope"
          />
        </div>

        <div className="cm-paren cm-dim">):</div>

        <div className="cm-field cm-field-desc">
          <label className="cm-label">description</label>
          <input
            className="cm-input"
            value={desc}
            onChange={e => setDesc(e.target.value)}
            placeholder="add login button"
            aria-label="description"
          />
        </div>
      </div>

      {/* ===== プレビュー ===== */}
      <div className="cm-preview-row">
        <code className={`cm-preview ${message ? '' : 'cm-preview-empty'}`}>
          {message || '（type と description を入力してください）'}
        </code>
        <button
          className="cm-btn cm-btn-primary"
          onClick={commit}
          disabled={!message}
        >
          <Clipboard size={14} /> コピー & 保存
        </button>
      </div>

      {/* ===== 履歴 ===== */}
      <div className="cm-history-grid">
        <HistoryColumn
          label="type 履歴"
          items={history.types}
          active={type}
          onPick={v => pick('type', v)}
          onRemove={v => {
            const next = { ...history, types: history.types.filter(t => t !== v) };
            setHistory(next); saveHistory(next);
          }}
        />
        <HistoryColumn
          label="scope 履歴"
          items={history.scopes}
          active={scope}
          onPick={v => pick('scope', v)}
          onRemove={v => {
            const next = { ...history, scopes: history.scopes.filter(s => s !== v) };
            setHistory(next); saveHistory(next);
          }}
        />
        <HistoryColumn
          label="description 履歴"
          items={history.descs}
          active={desc}
          onPick={v => pick('desc', v)}
          onRemove={v => {
            const next = { ...history, descs: history.descs.filter(d => d !== v) };
            setHistory(next); saveHistory(next);
          }}
        />
      </div>

      {/* ===== エクスポート / インポート ===== */}
      <div className="cm-io-row">
        <button className="cm-btn cm-btn-ghost" onClick={handleExport}>
          <Download size={14} /> JSON エクスポート
        </button>
        <button className="cm-btn cm-btn-ghost" onClick={() => importRef.current?.click()}>
          <Upload size={14} /> JSON インポート
        </button>
        <input
          ref={importRef}
          type="file"
          accept=".json"
          style={{ display: 'none' }}
          onChange={handleImport}
        />
      </div>

      {toast && <div className="cm-toast">{toast}</div>}
    </div>
  );
};

interface HistoryColumnProps {
  label: string;
  items: string[];
  active: string;
  onPick: (v: string) => void;
  onRemove: (v: string) => void;
}

const HistoryColumn = ({ label, items, active, onPick, onRemove }: HistoryColumnProps) => (
  <div className="cm-history-col">
    <div className="cm-history-label">{label}</div>
    {items.length === 0
      ? <div className="cm-history-empty">履歴なし</div>
      : (
        <ul className="cm-history-list">
          {items.map(item => (
            <li key={item} className={`cm-history-item ${active === item ? 'cm-history-item-active' : ''}`}>
              <button className="cm-history-val" onClick={() => onPick(item)}>{item}</button>
              <button className="cm-history-del" onClick={() => onRemove(item)} aria-label="削除">×</button>
            </li>
          ))}
        </ul>
      )
    }
  </div>
);

export default Commit;
