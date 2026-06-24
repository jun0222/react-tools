import { useState, useCallback, useEffect, useRef } from 'react';
import { Bookmark as BookmarkIcon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import {
  loadBookmarks, saveBookmarks, createBookmark,
  addBookmark, deleteBookmark, filterBookmarks,
  allTags, exportJson, importJson, parseTags,
  moveToPending, moveToTrash, restoreToActive, emptyTrash, getByStatus,
  updateBookmark,
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

type Tab = 'active' | 'pending' | 'trash';

const Bookmarks = () => {
  const { dark } = useTheme();
  const [items,      setItems]      = useState<Bookmark[]>(() => loadBookmarks());
  const [tagHistory, setTagHistory] = useState<string[]>(loadTagHistory);
  const [tab,        setTab]        = useState<Tab>('active');
  const [query,      setQuery]      = useState('');
  const [activeTag,  setActiveTag]  = useState('');
  const [showAdd,    setShowAdd]    = useState(false);
  const [showIo,     setShowIo]     = useState(false);
  const [newUrl,     setNewUrl]     = useState('');
  const [newTitle,   setNewTitle]   = useState('');
  const [newDesc,    setNewDesc]    = useState('');
  const [newTags,    setNewTags]    = useState('');
  const [importText, setImportText] = useState('');
  const [toast,      setToast]      = useState('');
  const [editingId,  setEditingId]  = useState<string | null>(null);
  const [editUrl,    setEditUrl]    = useState('');
  const [editTitle,  setEditTitle]  = useState('');
  const [editDesc,   setEditDesc]   = useState('');
  const [editTags,   setEditTags]   = useState('');
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

  const handlePending = (id: string) => {
    setItems(prev => moveToPending(prev, id));
    showToast('保留中に移動しました');
  };

  const handleTrash = (id: string) => {
    setItems(prev => moveToTrash(prev, id));
    showToast('ゴミ箱に移動しました');
  };

  const handleRestore = (id: string) => {
    setItems(prev => restoreToActive(prev, id));
    showToast('アクティブに戻しました');
  };

  const handlePermDelete = (id: string) => {
    setItems(prev => deleteBookmark(prev, id));
    showToast('完全に削除しました');
  };

  const handleEmptyTrash = () => {
    setItems(prev => emptyTrash(prev));
    showToast('ゴミ箱を空にしました');
  };

  const startEdit = (bm: Bookmark) => {
    setEditingId(bm.id);
    setEditUrl(bm.url);
    setEditTitle(bm.title === bm.url ? '' : bm.title);
    setEditDesc(bm.description);
    setEditTags(bm.tags.join(', '));
  };

  const cancelEdit = () => setEditingId(null);

  const handleSaveEdit = (bm: Bookmark) => {
    const url = editUrl.trim();
    if (!url) return;
    const tags = parseTags(editTags);
    setItems(prev => updateBookmark(prev, { ...bm, url, title: editTitle.trim() || url, description: editDesc.trim(), tags }));
    if (tags.length > 0) {
      setTagHistory(prev => {
        const set = new Set(prev);
        const added = tags.filter(t => !set.has(t));
        return added.length ? [...prev, ...added] : prev;
      });
    }
    setEditingId(null);
    showToast('変更を保存しました');
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

  const handleHtmlExport = () => {
    const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    const active = getByStatus(items, 'active');
    const byTag: Record<string, Bookmark[]> = {};
    const noTag: Bookmark[] = [];
    active.forEach(bm => {
      if (bm.tags.length === 0) { noTag.push(bm); return; }
      bm.tags.forEach(t => { (byTag[t] ??= []).push(bm); });
    });
    const renderList = (bms: Bookmark[]) =>
      bms.map(bm => `    <li><a href="${esc(bm.url)}">${esc(bm.title || bm.url)}</a>${bm.description ? ` <span style="color:#888">— ${esc(bm.description)}</span>` : ''}</li>`).join('\n');
    const sections = [
      ...Object.entries(byTag).sort(([a], [b]) => a.localeCompare(b)).map(([tag, bms]) =>
        `  <h2>${esc(tag)}</h2>\n  <ul>\n${renderList(bms)}\n  </ul>`),
      ...(noTag.length ? [`  <h2>タグなし</h2>\n  <ul>\n${renderList(noTag)}\n  </ul>`] : []),
    ].join('\n');
    const html = `<!DOCTYPE html>\n<html lang="ja">\n<head><meta charset="utf-8"><title>Bookmarks</title><style>body{font-family:sans-serif;max-width:800px;margin:40px auto;padding:0 20px}a{color:#f97316}h2{margin-top:24px;font-size:15px;color:#666}li{margin:6px 0}</style></head>\n<body>\n<h1>Bookmarks</h1>\n${sections}\n</body>\n</html>`;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'bookmarks.html'; a.click();
    URL.revokeObjectURL(url);
    showToast('HTMLエクスポートしました');
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

  const activeItems  = getByStatus(items, 'active');
  const pendingItems = getByStatus(items, 'pending');
  const trashItems   = getByStatus(items, 'trash');

  const tags = allTags(activeItems);
  const filtered = filterBookmarks(activeItems, query, activeTag);

  const pendingDays = (pendingAt?: number) => {
    if (!pendingAt) return 0;
    return Math.floor((Date.now() - pendingAt) / (1000 * 60 * 60 * 24));
  };

  const hasTitle = (bm: Bookmark) => bm.title && bm.title !== bm.url;

  return (
    <div className={`bookmarks ${dark ? 'dark' : 'light'}`}>
      <div className="bk-header">
        <div className="bk-logo-icon"><BookmarkIcon size={20} color="white" /></div>
        <h1><span className="accent">Bookmarks</span></h1>
        <div className="bk-header-actions">
          <button className="bk-btn bk-btn-ghost bk-btn-sm" onClick={() => setShowIo(v => !v)}>
            {showIo ? 'I/O を閉じる' : 'I/O'}
          </button>
          <button className="bk-btn bk-btn-primary bk-btn-sm" onClick={() => { setShowAdd(v => !v); if (showAdd) resetForm(); }}>
            {showAdd ? '✕' : '＋'}
          </button>
        </div>
      </div>

      {/* ===== ADD FORM ===== */}
      {showAdd && (
        <div className="bk-panel" ref={formRef}>
          <div className="bk-add-form">
            <input
              className="bk-input" placeholder="URL（必須）"
              value={newUrl} onChange={e => setNewUrl(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
              autoFocus
            />
            <div className="bk-add-row">
              <input className="bk-input" placeholder="タイトル（省略するとURL表示）" value={newTitle} onChange={e => setNewTitle(e.target.value)} />
              <input className="bk-input" placeholder="タグ（カンマ区切り）" value={newTags} onChange={e => setNewTags(e.target.value)} />
            </div>
            {tagHistory.length > 0 && (
              <div className="bk-tag-history">
                <span className="bk-tag-history-label">履歴</span>
                {tagHistory.map(t => (
                  <span key={t} className="bk-tag-history-chip">
                    <button className="bk-tag-history-name" onClick={() => appendTag(t)}>{t}</button>
                    <button className="bk-tag-history-remove" onClick={() => removeTagFromHistory(t)}>×</button>
                  </span>
                ))}
              </div>
            )}
            <input className="bk-input" placeholder="メモ（任意）" value={newDesc} onChange={e => setNewDesc(e.target.value)} />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
              <button className="bk-btn bk-btn-ghost bk-btn-sm" onClick={() => { setShowAdd(false); resetForm(); }}>キャンセル</button>
              <button className="bk-btn bk-btn-primary bk-btn-sm" onClick={handleAdd} disabled={!newUrl.trim()}>追加</button>
            </div>
          </div>
        </div>
      )}

      {/* ===== I/O ===== */}
      {showIo && (
        <div className="bk-panel">
          <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
            <button className="bk-btn bk-btn-ghost bk-btn-sm" onClick={handleExport}>JSONエクスポート</button>
            <button className="bk-btn bk-btn-ghost bk-btn-sm" onClick={handleHtmlExport}>HTMLエクスポート</button>
            <button className="bk-btn bk-btn-ghost bk-btn-sm" onClick={() => fileInputRef.current?.click()}>ファイルを開く</button>
            <input ref={fileInputRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleFileImport} />
          </div>
          <textarea
            className="bk-io-textarea" rows={4}
            placeholder="インポートするJSONを貼り付けるか、ファイルを開いてください"
            value={importText} onChange={e => setImportText(e.target.value)}
          />
          {importText && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 6 }}>
              <button className="bk-btn bk-btn-primary bk-btn-sm" onClick={handleImport}>インポート</button>
            </div>
          )}
        </div>
      )}

      {/* ===== TABS ===== */}
      <div className="bk-tabs">
        <button className={`bk-tab ${tab === 'active' ? 'active' : ''}`} onClick={() => setTab('active')}>
          アクティブ <span className="bk-tab-count">{activeItems.length}</span>
        </button>
        <button className={`bk-tab ${tab === 'pending' ? 'active' : ''}`} onClick={() => setTab('pending')}>
          保留中 <span className="bk-tab-count">{pendingItems.length}</span>
        </button>
        <button className={`bk-tab ${tab === 'trash' ? 'active' : ''}`} onClick={() => setTab('trash')}>
          ゴミ箱 <span className="bk-tab-count">{trashItems.length}</span>
        </button>
      </div>

      {/* ===== ACTIVE TAB ===== */}
      {tab === 'active' && (
        <>
          <div className="bk-search-bar">
            <input
              className="bk-search-input" placeholder="検索..."
              value={query} onChange={e => setQuery(e.target.value)}
            />
            <span style={{ fontSize: 11, color: 'var(--bk-text-dim)', whiteSpace: 'nowrap' }}>{filtered.length} 件</span>
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

          <div className="bk-grid">
            {filtered.length === 0 && (
              <div className="bk-empty">
                {activeItems.length === 0 ? 'ブックマークをまだ追加していません。' : '条件に合うブックマークがありません。'}
              </div>
            )}
            {filtered.map(bm => (
              <div key={bm.id} className="bk-card">
                {editingId === bm.id ? (
                  <div className="bk-add-form">
                    <input className="bk-input" placeholder="URL（必須）" value={editUrl} onChange={e => setEditUrl(e.target.value)} autoFocus />
                    <div className="bk-add-row">
                      <input className="bk-input" placeholder="タイトル" value={editTitle} onChange={e => setEditTitle(e.target.value)} />
                      <input className="bk-input" placeholder="タグ（カンマ区切り）" value={editTags} onChange={e => setEditTags(e.target.value)} />
                    </div>
                    <input className="bk-input" placeholder="メモ（任意）" value={editDesc} onChange={e => setEditDesc(e.target.value)} />
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                      <button className="bk-btn bk-btn-ghost bk-btn-xs" onClick={cancelEdit}>キャンセル</button>
                      <button className="bk-btn bk-btn-primary bk-btn-xs" onClick={() => handleSaveEdit(bm)} disabled={!editUrl.trim()}>保存</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="bk-card-body">
                      <a className="bk-card-title" href={bm.url} target="_blank" rel="noopener noreferrer">
                        {hasTitle(bm) ? bm.title : bm.url}
                      </a>
                      {hasTitle(bm) && (
                        <div className="bk-card-url">{bm.url}</div>
                      )}
                      {bm.description && <div className="bk-card-desc">{bm.description}</div>}
                      {bm.tags.length > 0 && (
                        <div className="bk-card-tags">
                          {bm.tags.map(t => <span key={t} className="bk-tag">{t}</span>)}
                        </div>
                      )}
                    </div>
                    <div className="bk-card-actions">
                      <button className="bk-btn bk-btn-ghost bk-btn-xs" onClick={async () => {
                        try { await navigator.clipboard.writeText(bm.url); showToast('URLをコピーしました'); }
                        catch { showToast('コピー失敗'); }
                      }}>コピー</button>
                      <button className="bk-btn bk-btn-ghost bk-btn-xs" onClick={() => startEdit(bm)}>編集</button>
                      <button className="bk-btn bk-btn-ghost bk-btn-xs" onClick={() => handlePending(bm.id)}>最近見ていない</button>
                      <button className="bk-btn bk-btn-ghost bk-btn-xs" onClick={() => handleTrash(bm.id)}>🗑</button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {/* ===== PENDING TAB ===== */}
      {tab === 'pending' && (
        <div className="bk-grid">
          {pendingItems.length === 0 && <div className="bk-empty">保留中のブックマークはありません。</div>}
          {pendingItems.map(bm => {
            const days = pendingDays(bm.pendingAt);
            const daysLeft = 30 - days;
            return (
              <div key={bm.id} className="bk-card bk-card-pending">
                {editingId === bm.id ? (
                  <div className="bk-add-form">
                    <input className="bk-input" placeholder="URL（必須）" value={editUrl} onChange={e => setEditUrl(e.target.value)} autoFocus />
                    <div className="bk-add-row">
                      <input className="bk-input" placeholder="タイトル" value={editTitle} onChange={e => setEditTitle(e.target.value)} />
                      <input className="bk-input" placeholder="タグ（カンマ区切り）" value={editTags} onChange={e => setEditTags(e.target.value)} />
                    </div>
                    <input className="bk-input" placeholder="メモ（任意）" value={editDesc} onChange={e => setEditDesc(e.target.value)} />
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                      <button className="bk-btn bk-btn-ghost bk-btn-xs" onClick={cancelEdit}>キャンセル</button>
                      <button className="bk-btn bk-btn-primary bk-btn-xs" onClick={() => handleSaveEdit(bm)} disabled={!editUrl.trim()}>保存</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="bk-card-body">
                      <a className="bk-card-title" href={bm.url} target="_blank" rel="noopener noreferrer">
                        {hasTitle(bm) ? bm.title : bm.url}
                      </a>
                      {hasTitle(bm) && <div className="bk-card-url">{bm.url}</div>}
                      {bm.description && <div className="bk-card-desc">{bm.description}</div>}
                      {bm.tags.length > 0 && (
                        <div className="bk-card-tags">
                          {bm.tags.map(t => <span key={t} className="bk-tag">{t}</span>)}
                        </div>
                      )}
                      <div className="bk-card-expiry">{daysLeft > 0 ? `あと${daysLeft}日でゴミ箱へ` : 'まもなくゴミ箱へ'}</div>
                    </div>
                    <div className="bk-card-actions">
                      <button className="bk-btn bk-btn-ghost bk-btn-xs" onClick={() => startEdit(bm)}>編集</button>
                      <button className="bk-btn bk-btn-ghost bk-btn-xs" onClick={() => handleRestore(bm.id)}>戻す</button>
                      <button className="bk-btn bk-btn-ghost bk-btn-xs" onClick={() => handleTrash(bm.id)}>🗑</button>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ===== TRASH TAB ===== */}
      {tab === 'trash' && (
        <>
          {trashItems.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 4 }}>
              <button className="bk-btn bk-btn-danger bk-btn-sm" onClick={handleEmptyTrash}>ゴミ箱を空にする</button>
            </div>
          )}
          <div className="bk-grid">
            {trashItems.length === 0 && <div className="bk-empty">ゴミ箱は空です。</div>}
            {trashItems.map(bm => (
              <div key={bm.id} className="bk-card bk-card-trash">
                <div className="bk-card-body">
                  <div className="bk-card-title bk-card-title-muted">
                    {hasTitle(bm) ? bm.title : bm.url}
                  </div>
                  {hasTitle(bm) && <div className="bk-card-url">{bm.url}</div>}
                  {bm.tags.length > 0 && (
                    <div className="bk-card-tags">
                      {bm.tags.map(t => <span key={t} className="bk-tag">{t}</span>)}
                    </div>
                  )}
                </div>
                <div className="bk-card-actions">
                  <button className="bk-btn bk-btn-ghost bk-btn-xs" onClick={() => handleRestore(bm.id)}>戻す</button>
                  <button className="bk-btn bk-btn-danger bk-btn-xs" onClick={() => handlePermDelete(bm.id)}>完全削除</button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {toast && <div className="bk-toast">{toast}</div>}
    </div>
  );
};

export default Bookmarks;
