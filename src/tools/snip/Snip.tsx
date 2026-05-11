import { useState, useCallback, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import {
  loadSnippets, saveSnippets, createSnippet,
  addSnippet, deleteSnippet, filterSnippets, displayTitle,
} from './snipCore';
import './Snip.css';

const Snip = () => {
  const { dark } = useTheme();
  const [items, setItems] = useState(() => loadSnippets());
  const [query, setQuery] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [newText, setNewText] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [toast, setToast] = useState('');

  useEffect(() => { saveSnippets(items); }, [items]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 1800);
  }, []);

  const handleAdd = () => {
    if (!newText.trim()) return;
    const sn = createSnippet(newText, newTitle);
    setItems(prev => addSnippet(prev, sn));
    setNewText('');
    setNewTitle('');
    setShowAdd(false);
  };

  const handleDelete = (id: string) => {
    setItems(prev => deleteSnippet(prev, id));
    showToast('削除しました');
  };

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast('コピーしました');
    } catch {
      showToast('コピー失敗');
    }
  };

  const filtered = filterSnippets(items, query);

  return (
    <div className={`snip ${dark ? 'dark' : 'light'}`}>
      <header className="sn-header">
        <div className="sn-logo">✂️</div>
        <h1><span className="accent">Snip</span></h1>
      </header>

      <div className="sn-search-row">
        <input
          className="sn-search"
          placeholder="検索..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          aria-label="検索"
        />
        <span className="sn-count">{filtered.length} 件</span>
        <button
          className="sn-btn sn-btn-open"
          onClick={() => setShowAdd(v => !v)}
        >
          {showAdd ? '✕' : '＋ 追加'}
        </button>
      </div>

      {showAdd && (
        <div className="sn-add-form">
          <textarea
            className="sn-textarea"
            placeholder="登録するテキストを入力..."
            value={newText}
            onChange={e => setNewText(e.target.value)}
            rows={4}
            autoFocus
            aria-label="スニペットのテキスト"
          />
          <input
            className="sn-title-input"
            placeholder="タイトル（任意）"
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleAdd(); }}
            aria-label="タイトル"
          />
          <div className="sn-add-actions">
            <button className="sn-btn sn-btn-ghost" onClick={() => { setShowAdd(false); setNewText(''); setNewTitle(''); }}>
              キャンセル
            </button>
            <button className="sn-btn sn-btn-primary" onClick={handleAdd} disabled={!newText.trim()}>
              登録
            </button>
          </div>
        </div>
      )}

      <div className="sn-list">
        {filtered.length === 0 && (
          <div className="sn-empty">
            {items.length === 0
              ? '「＋ 追加」からスニペットを登録してください。'
              : '条件に合うスニペットがありません。'}
          </div>
        )}
        {filtered.map(sn => (
          <div key={sn.id} className="sn-item">
            <div className="sn-item-body">
              <div className="sn-item-title">{displayTitle(sn)}</div>
              {sn.title && <div className="sn-item-preview">{sn.text}</div>}
            </div>
            <div className="sn-item-actions">
              <button
                className="sn-btn sn-btn-icon"
                onClick={() => handleCopy(sn.text)}
                aria-label="コピー"
              >
                コピー
              </button>
              <button
                className="sn-btn sn-btn-icon"
                onClick={() => handleDelete(sn.id)}
                aria-label="削除"
              >
                削除
              </button>
            </div>
          </div>
        ))}
      </div>

      {toast && <div className="sn-toast">{toast}</div>}
    </div>
  );
};

export default Snip;
