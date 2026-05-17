import { useState, useCallback, useEffect } from 'react';
import { BookOpen, Clipboard } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import {
  loadMemos, saveMemos, createMemo,
  addMemo, deleteMemo, filterMemos, generatePrompt,
} from './wordmemoCore';
import './WordMemo.css';

const WordMemo = () => {
  const { dark } = useTheme();
  const [items, setItems] = useState(() => loadMemos());
  const [query, setQuery] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [newWord, setNewWord] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [toast, setToast] = useState('');

  useEffect(() => { saveMemos(items); }, [items]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 1800);
  }, []);

  const handleAdd = () => {
    if (!newWord.trim()) return;
    const memo = createMemo(newWord, newNotes);
    setItems(prev => addMemo(prev, memo));
    setNewWord('');
    setNewNotes('');
    setShowAdd(false);
  };

  const handleDelete = (id: string) => {
    setItems(prev => deleteMemo(prev, id));
    showToast('削除しました');
  };

  const handleCopyPrompt = async () => {
    const prompt = generatePrompt(items);
    if (!prompt) return;
    try {
      await navigator.clipboard.writeText(prompt);
      showToast('プロンプトをコピーしました');
    } catch {
      showToast('コピー失敗');
    }
  };

  const filtered = filterMemos(items, query);

  return (
    <div className={`wordmemo ${dark ? 'dark' : 'light'}`}>
      <header className="wm-header">
        <div className="wm-logo"><BookOpen size={22} color="white" /></div>
        <h1><span className="accent">WordMemo</span></h1>
      </header>
      <p className="wm-subtitle">
        気になった単語・概念をメモしておき、AIエージェントに渡す文献リサーチ用プロンプトを生成します。
      </p>

      <button
        className="wm-copy-btn"
        onClick={handleCopyPrompt}
        disabled={items.length === 0}
        aria-label="プロンプトをコピー"
      >
        <Clipboard size={14} /> プロンプトをコピー（{items.length}件）
      </button>

      <div className="wm-search-row">
        <input
          className="wm-search"
          placeholder="検索..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          aria-label="検索"
        />
        <span className="wm-count">{filtered.length} 件</span>
        <button
          className="wm-btn wm-btn-open"
          onClick={() => setShowAdd(v => !v)}
        >
          {showAdd ? '✕' : '＋ 追加'}
        </button>
      </div>

      {showAdd && (
        <div className="wm-add-form">
          <input
            className="wm-input"
            placeholder="単語・概念名（必須）"
            value={newWord}
            onChange={e => setNewWord(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleAdd(); }}
            autoFocus
            aria-label="単語"
          />
          <input
            className="wm-input"
            placeholder="補足メモ（任意）"
            value={newNotes}
            onChange={e => setNewNotes(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleAdd(); }}
            aria-label="補足メモ"
          />
          <div className="wm-add-actions">
            <button className="wm-btn wm-btn-ghost" onClick={() => { setShowAdd(false); setNewWord(''); setNewNotes(''); }}>
              キャンセル
            </button>
            <button className="wm-btn wm-btn-primary" onClick={handleAdd} disabled={!newWord.trim()}>
              追加
            </button>
          </div>
        </div>
      )}

      <div className="wm-list">
        {filtered.length === 0 && (
          <div className="wm-empty">
            {items.length === 0
              ? '「＋ 追加」から気になった単語を登録してください。'
              : '条件に合う単語がありません。'}
          </div>
        )}
        {filtered.map(m => (
          <div key={m.id} className="wm-item">
            <div className="wm-item-body">
              <div className="wm-item-word">{m.word}</div>
              {m.notes && <div className="wm-item-notes">{m.notes}</div>}
            </div>
            <div className="wm-item-actions">
              <button
                className="wm-btn wm-btn-icon"
                onClick={() => handleDelete(m.id)}
                aria-label="削除"
              >
                削除
              </button>
            </div>
          </div>
        ))}
      </div>

      {toast && <div className="wm-toast">{toast}</div>}
    </div>
  );
};

export default WordMemo;
