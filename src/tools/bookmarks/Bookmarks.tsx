import { useState, useCallback, useEffect, useRef } from 'react';
import { Bookmark as BookmarkIcon, Trash2 } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import {
  loadBookmarks, saveBookmarks, createBookmark,
  addBookmark, deleteBookmark, filterBookmarks,
  allTags, exportJson, importJson, parseTags,
} from './bookmarksCore';
import type { Bookmark } from './bookmarksCore';
import './Bookmarks.css';

const SK_TAG_HISTORY = 'bookmarks-tag-history';

const loadTagHistory = (): string[] => {
  try {
    const raw = localStorage.getItem(SK_TAG_HISTORY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
};

const Bookmarks = () => {
  const { dark } = useTheme();
  const [items,      setItems]      = useState<Bookmark[]>(() => loadBookmarks());
  const [tagHistory, setTagHistory] = useState<string[]>(loadTagHistory);
  const [query,      setQuery]      = useState('');
  const [activeTag,  setActiveTag]  = useState('');
  const [showAdd,    setShowAdd]    = useState(false);
  const [showIo,     setShowIo]     = useState(false);
  const [deleteMode, setDeleteMode] = useState(false);
  const [newUrl,     setNewUrl]     = useState('');
  const [newTitle,   setNewTitle]   = useState('');
  const [newDesc,    setNewDesc]    = useState('');
  const [newTags,    setNewTags]    = useState('');
  const [importText, setImportText] = useState('');
  const [toast,      setToast]      = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef      = useRef<HTMLDivElement>(null);

  useEffect(() => { saveBookmarks(items); }, [items]);
  useEffect(() => { localStorage.setItem(SK_TAG_HISTORY, JSON.stringify(tagHistory)); }, [tagHistory]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 1800);
  }, []);

  const resetForm = () => {
    setNewUrl(''); setNewTitle(''); setNewDesc(''); setNewTags('');
  };

  const handleAdd = () => {
    if (!newUrl.trim()) return;
    const tags = parseTags(newTags);
    const bm = createBookmark(newUrl.trim(), newTitle.trim(), newDesc.trim(), tags);
    setItems(prev => addBookmark(prev, bm));
    if (tags.length > 0) {
      setTagHistory(prev => {
        const set = new Set(prev);
        const added = tags.filter(t => !set.has(t));
        return added.length ? [...prev, ...added] : prev;
      });
    }
    resetForm();
    setShowAdd(false);
    showToast('ブックマークを追加しました');
  };

  const handleDuplicate = (bm: Bookmark) => {
    setNewUrl(bm.url);
    setNewTitle(bm.title);
    setNewDesc(bm.description);
    setNewTags(bm.tags.join(', '));
    setShowAdd(true);
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  };

  const handleDelete = (id: string) => {
    setItems(prev => deleteBookmark(prev, id));
    showToast('削除しました');
  };

  const appendTag = (tag: string) => {
    setNewTags(prev => {
      const existing = parseTags(prev);
      if (existing.includes(tag)) return prev;
      return prev.trim() ? `${prev.trim()}, ${tag}` : tag;
    });
  };

  const removeTagFromHistory = (tag: string) => {
    setTagHistory(prev => prev.filter(t => t !== tag));
  };

  const handleExport = () => {
    const json = exportJson(items);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'bookmarks.json'; a.click();
    URL.revokeObjectURL(url);
    showToast('エクスポートしました');
  };

  const handleImport = () => {
    const imported = importJson(importText);
    if (!imported.length) { showToast('インポートできるデータがありません'); return; }
    setItems(prev => {
      const existingIds = new Set(prev.map(b => b.id));
      return [...prev, ...imported.filter(b => !existingIds.has(b.id))];
    });
    setImportText(''); setShowIo(false);
    showToast(`${imported.length}件インポートしました`);
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setImportText(ev.target?.result as string);
    reader.readAsText(file);
    e.target.value = '';
  };

  const tags = allTags(items);
  const filtered = filterBookmarks(items, query, activeTag);

  return (
    <div className={`bookmarks ${dark ? 'dark' : 'light'}`}>
      <div className="bk-header">
        <div className="bk-logo-icon"><BookmarkIcon size={22} color="white" /></div>
        <h1><span className="accent">Bookmarks</span></h1>
      </div>

      {/* ===== ADD FORM ===== */}
      <div className="bk-panel" ref={formRef}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="bk-panel-title" style={{ marginBottom: showAdd ? 12 : 0 }}>ブックマーク追加</div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="bk-btn bk-btn-ghost bk-btn-sm" onClick={() => setShowIo(v => !v)}>
              {showIo ? 'I/O を閉じる' : 'インポート / エクスポート'}
            </button>
            <button className="bk-btn bk-btn-primary bk-btn-sm" onClick={() => { setShowAdd(v => !v); if (showAdd) resetForm(); }}>
              {showAdd ? '✕' : '＋ 追加'}
            </button>
          </div>
        </div>

        {showAdd && (
          <div className="bk-add-form">
            <input
              className="bk-input" placeholder="URL（必須）"
              value={newUrl} onChange={e => setNewUrl(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
              autoFocus aria-label="URL"
            />
            <div className="bk-add-row">
              <input className="bk-input" placeholder="タイトル（省略するとURLをそのまま使用）" value={newTitle} onChange={e => setNewTitle(e.target.value)} aria-label="タイトル" />
              <input className="bk-input" placeholder="タグ（カンマまたはスペース区切り）" value={newTags} onChange={e => setNewTags(e.target.value)} aria-label="タグ" />
            </div>
            {tagHistory.length > 0 && (
              <div className="bk-tag-history">
                <span className="bk-tag-history-label">履歴</span>
                {tagHistory.map(t => (
                  <span key={t} className="bk-tag-history-chip">
                    <button className="bk-tag-history-name" onClick={() => appendTag(t)}>{t}</button>
                    <button className="bk-tag-history-remove" onClick={() => removeTagFromHistory(t)} aria-label="履歴から削除">×</button>
                  </span>
                ))}
              </div>
            )}
            <input className="bk-input" placeholder="メモ・説明（任意）" value={newDesc} onChange={e => setNewDesc(e.target.value)} aria-label="説明" />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
              <button className="bk-btn bk-btn-ghost bk-btn-sm" onClick={() => { setShowAdd(false); resetForm(); }}>キャンセル</button>
              <button className="bk-btn bk-btn-primary bk-btn-sm" onClick={handleAdd} disabled={!newUrl.trim()}>追加</button>
            </div>
          </div>
        )}

        {showIo && (
          <div style={{ marginTop: 12 }}>
            <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
              <button className="bk-btn bk-btn-ghost bk-btn-sm" onClick={handleExport}>JSON エクスポート</button>
              <button className="bk-btn bk-btn-ghost bk-btn-sm" onClick={() => fileInputRef.current?.click()}>ファイルを開く</button>
              <input ref={fileInputRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleFileImport} />
            </div>
            <textarea
              className="bk-io-textarea" rows={4}
              placeholder="インポートするJSONをここに貼り付けるか、ファイルを開いてください"
              value={importText} onChange={e => setImportText(e.target.value)} aria-label="インポートJSON"
            />
            {importText && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 6 }}>
                <button className="bk-btn bk-btn-primary bk-btn-sm" onClick={handleImport}>インポート</button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ===== SEARCH + FILTER ===== */}
      <div className="bk-search-bar">
        <input
          className="bk-search-input" placeholder="検索..."
          value={query} onChange={e => setQuery(e.target.value)} aria-label="検索"
        />
        <span style={{ fontSize: 12, color: 'var(--bk-text-dim)' }}>{filtered.length} 件</span>
        <button
          className={`bk-btn bk-btn-sm ${deleteMode ? 'bk-btn-danger' : 'bk-btn-ghost'}`}
          onClick={() => setDeleteMode(v => !v)}
        >
          <Trash2 size={13} style={{ marginRight: 4 }} />
          {deleteMode ? '削除モード中' : '削除モード'}
        </button>
      </div>

      {tags.length > 0 && (
        <div className="bk-tag-bar">
          <button className={`bk-tag-chip ${activeTag === '' ? 'bk-tag-chip-active' : ''}`} onClick={() => setActiveTag('')}>すべて</button>
          {tags.map(t => (
            <button key={t} className={`bk-tag-chip ${activeTag === t ? 'bk-tag-chip-active' : ''}`} onClick={() => setActiveTag(prev => prev === t ? '' : t)}>
              {t}
            </button>
          ))}
        </div>
      )}

      {/* ===== LIST ===== */}
      <div className="bk-list">
        {filtered.length === 0 && (
          <div className="bk-empty">
            {items.length === 0 ? 'ブックマークをまだ追加していません。' : '条件に合うブックマークがありません。'}
          </div>
        )}
        {filtered.map(bm => (
          <div key={bm.id} className="bk-item">
            <div className="bk-item-main">
              <div className="bk-item-title">{bm.title}</div>
              <a className="bk-item-url" href={bm.url} target="_blank" rel="noopener noreferrer">{bm.url}</a>
              {bm.description && <div className="bk-item-desc">{bm.description}</div>}
              {bm.tags.length > 0 && (
                <div className="bk-item-tags">
                  {bm.tags.map(t => <span key={t} className="bk-tag">{t}</span>)}
                </div>
              )}
            </div>
            <div className="bk-item-actions">
              <button
                className="bk-btn bk-btn-ghost bk-btn-sm"
                onClick={async () => {
                  try { await navigator.clipboard.writeText(bm.url); showToast('URLをコピーしました'); }
                  catch { showToast('コピー失敗'); }
                }}
              >コピー</button>
              <button className="bk-btn bk-btn-ghost bk-btn-sm" onClick={() => handleDuplicate(bm)}>複製</button>
              {deleteMode && (
                <button className="bk-btn bk-btn-danger bk-btn-sm" onClick={() => handleDelete(bm.id)}>削除</button>
              )}
            </div>
          </div>
        ))}
      </div>

      {toast && <div className="bk-toast">{toast}</div>}
    </div>
  );
};

export default Bookmarks;
