import { useState, useEffect, useRef, useCallback } from 'react';
import mermaid from 'mermaid';
import { MessageSquare } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import './Convmap.css';

const STORAGE_KEY = 'convmap-entries';

interface ConvEntry {
  id: string;
  title: string;
  description: string;
  prompt: string;
  mermaidCode: string;
  createdAt: string;
}

let _id = 0;
const uid = () => `cm${Date.now()}${++_id}`;

let renderSeq = 0;

const load = (): ConvEntry[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
};

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return `${d.getFullYear()}/${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
};

const buildMarkdown = (entries: ConvEntry[]): string =>
  entries.map(e => [
    `## ${e.title}`,
    `*${formatDate(e.createdAt)}*`,
    e.description ? `\n${e.description}\n` : '',
    e.prompt ? `### プロンプト\n${e.prompt}\n` : '',
    e.mermaidCode ? `\`\`\`mermaid\n${e.mermaidCode}\n\`\`\`` : '',
  ].filter(Boolean).join('\n')).join('\n\n---\n\n');

const DiagramView = ({ code, dark }: { code: string; dark: boolean }) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current || !code.trim()) return;
    const id = `cm-svg-${++renderSeq}`;
    mermaid.initialize({ startOnLoad: false, theme: dark ? 'dark' : 'default' });
    mermaid.render(id, code)
      .then(({ svg }) => { if (ref.current) ref.current.innerHTML = svg; })
      .catch(() => { if (ref.current) ref.current.innerHTML = '<span class="cm-parse-error">Mermaid parse error</span>'; });
  }, [code, dark]);

  return <div ref={ref} />;
};

const Convmap = () => {
  const { dark } = useTheme();
  const [entries, setEntries] = useState<ConvEntry[]>(load);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', prompt: '', mermaidCode: '' });
  const [toast, setToast] = useState('');

  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(entries)); }, [entries]);

  const showToast = useCallback((msg: string) => {
    setToast(msg); setTimeout(() => setToast(''), 1800);
  }, []);

  const handleAdd = () => {
    if (!form.title.trim() && !form.mermaidCode.trim()) return;
    const entry: ConvEntry = {
      id: uid(),
      title: form.title.trim() || '無題',
      description: form.description.trim(),
      prompt: form.prompt.trim(),
      mermaidCode: form.mermaidCode.trim(),
      createdAt: new Date().toISOString(),
    };
    setEntries(prev => [entry, ...prev]);
    setForm({ title: '', description: '', prompt: '', mermaidCode: '' });
    setShowAdd(false);
    showToast('追加しました');
  };

  const handleDelete = (id: string) => {
    setEntries(prev => prev.filter(e => e.id !== id));
    showToast('削除しました');
  };

  const downloadMd = () => {
    if (!entries.length) return;
    const md = buildMarkdown([...entries].reverse());
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const fname = `convmap_${d.getFullYear()}_${pad(d.getMonth()+1)}_${pad(d.getDate())}.md`;
    const blob = new Blob([md], { type: 'text/markdown' });
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: fname });
    a.click(); URL.revokeObjectURL(a.href);
    showToast('Markdownをダウンロードしました');
  };

  return (
    <div className={`convmap-root ${dark ? 'dark' : 'light'}`}>
      <div className="cm-header">
        <div className="cm-logo-icon"><MessageSquare size={22} color="white" /></div>
        <h1><span className="cm-accent">Convmap</span></h1>
        <button className="cm-btn cm-btn-primary" onClick={() => setShowAdd(v => !v)}>
          {showAdd ? '✕ 閉じる' : '＋ 追加'}
        </button>
      </div>

      {/* ===== ADD FORM ===== */}
      {showAdd && (
        <div className="cm-add-panel">
          <div className="cm-add-header">
            <div className="cm-panel-title">LLM会話を追加</div>
          </div>
          <div className="cm-add-form">
            <input
              className="cm-input"
              placeholder="タイトル"
              value={form.title}
              onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              autoFocus
            />
            <input
              className="cm-input"
              placeholder="説明・メモ（任意）"
              value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
            />
            <textarea
              className="cm-textarea"
              placeholder="プロンプト（任意）"
              rows={3}
              value={form.prompt}
              onChange={e => setForm(p => ({ ...p, prompt: e.target.value }))}
            />
            <textarea
              className="cm-textarea"
              placeholder={`Mermaidコードを貼り付け\n\nflowchart TD\n  A[開始] --> B[処理]\n  B --> C[終了]`}
              rows={8}
              value={form.mermaidCode}
              onChange={e => setForm(p => ({ ...p, mermaidCode: e.target.value }))}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button className="cm-btn cm-btn-ghost" onClick={() => { setShowAdd(false); setForm({ title: '', description: '', prompt: '', mermaidCode: '' }); }}>
                キャンセル
              </button>
              <button className="cm-btn cm-btn-primary" onClick={handleAdd} disabled={!form.title.trim() && !form.mermaidCode.trim()}>
                追加
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== DOWNLOAD ===== */}
      {entries.length > 0 && (
        <div className="cm-download-row">
          <button className="cm-btn cm-btn-ghost cm-btn-sm" onClick={downloadMd}>Markdown でダウンロード</button>
          <span style={{ fontSize: 12, color: 'var(--cm-muted)' }}>{entries.length} 件</span>
        </div>
      )}

      {/* ===== LIST ===== */}
      <div className="cm-list">
        {entries.length === 0 && !showAdd && (
          <div className="cm-empty">「＋ 追加」からLLMとの会話を記録してください</div>
        )}
        {entries.map(entry => (
          <div key={entry.id} className="cm-entry">
            <div className="cm-entry-header">
              <div className="cm-entry-meta">
                <div className="cm-entry-title">{entry.title}</div>
                {entry.description && <div className="cm-entry-desc">{entry.description}</div>}
                <div className="cm-entry-date">{formatDate(entry.createdAt)}</div>
              </div>
              <div className="cm-entry-actions">
                <button className="cm-btn cm-btn-ghost cm-btn-sm" onClick={() => handleDelete(entry.id)}>削除</button>
              </div>
            </div>
            <div className="cm-entry-body">
              {entry.mermaidCode && (
                <div className="cm-entry-diagram">
                  <DiagramView code={entry.mermaidCode} dark={dark} />
                </div>
              )}
              {entry.prompt && (
                <div className="cm-entry-prompt">{entry.prompt}</div>
              )}
            </div>
          </div>
        ))}
      </div>

      {toast && <div className="cm-toast">{toast}</div>}
    </div>
  );
};

export default Convmap;
