import { useState, useCallback } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { BUILTIN_SNIPPETS } from './builtinSnippets';
import type { Snippet } from './builtinSnippets';
import './Clips.css';

interface UserSnippet {
  id: string;
  title: string;
  description: string;
  lang: Snippet['lang'];
  code: string;
  tags: string[];
  builtin?: false;
}

type AnySnippet = Snippet | UserSnippet;

const STORAGE_KEY = 'clips-custom';
let _id = 0;
const uid = () => `cl-${++_id}-${Date.now()}`;

const loadCustom = (): UserSnippet[] => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]'); } catch { return []; }
};
const saveCustom = (items: UserSnippet[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
};

const langBadgeClass = (lang: Snippet['lang']) =>
  lang === 'javascript' ? 'cl-badge-js' : lang === 'typescript' ? 'cl-badge-ts' : 'cl-badge-bash';

const Clips = () => {
  const { dark } = useTheme();
  const [customSnippets, setCustomSnippets] = useState<UserSnippet[]>(loadCustom);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newLang, setNewLang] = useState<Snippet['lang']>('javascript');
  const [newCode, setNewCode] = useState('');
  const [newTags, setNewTags] = useState('');
  const [toast, setToast] = useState('');

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 1800);
  }, []);

  const allSnippets: AnySnippet[] = [...BUILTIN_SNIPPETS, ...customSnippets];

  const copySnippet = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      showToast('コピーしました');
    } catch {
      showToast('コピー失敗');
    }
  };

  const addSnippet = () => {
    if (!newTitle.trim() || !newCode.trim()) return;
    const s: UserSnippet = {
      id: uid(),
      title: newTitle.trim(),
      description: newDesc.trim(),
      lang: newLang,
      code: newCode,
      tags: newTags.split(',').map(t => t.trim()).filter(Boolean),
    };
    const next = [...customSnippets, s];
    setCustomSnippets(next);
    saveCustom(next);
    setNewTitle(''); setNewDesc(''); setNewCode(''); setNewTags('');
    setShowAddForm(false);
    showToast('追加しました');
  };

  const removeSnippet = (id: string) => {
    const next = customSnippets.filter(s => s.id !== id);
    setCustomSnippets(next);
    saveCustom(next);
    showToast('削除しました');
  };

  return (
    <div className={`cl-root ${dark ? 'dark' : 'light'}`}>
      <div className="cl-header">
        <div className="cl-header-left">
          <div className="cl-logo-icon">📋</div>
          <h1><span className="accent">Clips</span></h1>
        </div>
        <button className="cl-btn cl-btn-accent" onClick={() => setShowAddForm(v => !v)}>
          {showAddForm ? 'キャンセル' : '＋ スニペットを追加'}
        </button>
      </div>

      {/* Add form */}
      {showAddForm && (
        <div className="cl-add-form">
          <div className="cl-add-row">
            <input className="cl-add-input" placeholder="タイトル" value={newTitle} onChange={e => setNewTitle(e.target.value)} />
            <select className="cl-add-select" value={newLang} onChange={e => setNewLang(e.target.value as Snippet['lang'])}>
              <option value="javascript">JavaScript</option>
              <option value="typescript">TypeScript</option>
              <option value="bash">Bash</option>
            </select>
            <input className="cl-add-input" placeholder="タグ（カンマ区切り）" value={newTags} onChange={e => setNewTags(e.target.value)} style={{ maxWidth: 200 }} />
          </div>
          <input className="cl-add-input" placeholder="説明（任意）" value={newDesc} onChange={e => setNewDesc(e.target.value)} style={{ width: '100%' }} />
          <textarea className="cl-add-textarea" placeholder="コードを貼り付け…" value={newCode} onChange={e => setNewCode(e.target.value)} />
          <div>
            <button className="cl-btn cl-btn-accent" onClick={addSnippet} disabled={!newTitle.trim() || !newCode.trim()}>
              追加する
            </button>
          </div>
        </div>
      )}

      {/* Grid */}
      <div className="cl-grid">
        {allSnippets.map(s => (
          <div key={s.id} className="cl-card">
            <div className="cl-card-header">
              <div className="cl-card-title-area">
                <span className="cl-card-title">{s.title}</span>
                {s.description && <span className="cl-card-desc">{s.description}</span>}
              </div>
            </div>
            <div className="cl-card-badges">
              <span className={`cl-badge ${langBadgeClass(s.lang)}`}>{s.lang}</span>
              {s.builtin && <span className="cl-badge cl-badge-builtin">builtin</span>}
              {s.tags.map(tag => (
                <span key={tag} className="cl-badge cl-badge-tag">{tag}</span>
              ))}
            </div>
            <div className="cl-card-code">{s.code}</div>
            <div className="cl-card-actions">
              <button className="cl-btn cl-btn-ghost" onClick={() => copySnippet(s.code)}>
                コピー
              </button>
              {!s.builtin && (
                <button className="cl-btn cl-btn-danger" onClick={() => removeSnippet(s.id)}>
                  削除
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {toast && <div className="cl-toast">{toast}</div>}
    </div>
  );
};

export default Clips;