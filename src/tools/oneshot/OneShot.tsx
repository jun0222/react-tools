import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { PromptEntry, Reply, FilterMode } from './helpers';
import {
  getShotTitle, loadPrompts, savePrompts, uid,
  exportPrompts, importPrompts, findDuplicateIds, buildGlobalDistillPrompt,
  copyToClipboard, loadFilterState, saveFilterState,
} from './helpers';
import {
  ZapIcon, CopyIcon, PlusIcon, TrashIcon, EditIcon,
  SendIcon, CheckIcon, ReplyIcon, DownloadIcon, UploadIcon,
  SparklesIcon, RestoreIcon, SpinnerIcon,
} from './icons';
import { useTheme } from '../../context/ThemeContext';
import './OneShot.css';

// TODO: 複数プロジェクト対応
// 現在は全プロンプトが1つのプロジェクトに属している。
// 将来的には「プロジェクト」という概念を追加し、プロジェクトごとにプロンプトを管理できるようにしたい。
// 実装イメージ:
// - PromptEntry に projectId を追加
// - Project 型 (id, name, color) を定義
// - ヘッダーにプロジェクト切替セレクタを追加
// - localStorage のキーをプロジェクトごとに分ける（例: `oneshot-prompts-${projectId}`）

const parseTags = (input: string): string[] =>
  input.split(',').map(t => t.trim()).filter(Boolean);

const renderInline = (text: string): React.ReactNode => {
  const parts = text.split(/(~~.+?~~)/g);
  if (parts.length === 1) return text;
  return parts.map((part, i) => {
    const m = part.match(/^~~(.+)~~$/);
    return m ? <s key={i}>{m[1]}</s> : part;
  });
};

const OneShot = () => {
  const { dark } = useTheme();
  const [prompts, setPrompts] = useState<PromptEntry[]>(loadPrompts);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newBody, setNewBody] = useState('');
  const [newTags, setNewTags] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBody, setEditBody] = useState('');
  const [editTags, setEditTags] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [showTrash, setShowTrash] = useState(false);
  const [toast, setToast] = useState('');
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [filterMode, setFilterMode] = useState<FilterMode>(() => loadFilterState().filterMode);
  const [selectedTag, setSelectedTag] = useState<string | null>(() => loadFilterState().selectedTag);
  const [collapsed, setCollapsed] = useState<Set<string>>(() => {
    const resolved = loadPrompts().filter(p => p.resolved && !p.trashedAt).map(p => p.id);
    return new Set(resolved);
  });

  const [splittingId, setSplittingId] = useState<string | null>(null);

  const listRef = useRef<HTMLDivElement>(null);
  const newBodyRef = useRef<HTMLTextAreaElement>(null);
  const editBodyRef = useRef<HTMLTextAreaElement>(null);
  const newBodyCursorRef = useRef<number | null>(null);
  const editBodyCursorRef = useRef<number | null>(null);

  useEffect(() => {
    const el = newBodyRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = el.scrollHeight + 'px';
      if (newBodyCursorRef.current !== null) {
        el.setSelectionRange(newBodyCursorRef.current, newBodyCursorRef.current);
        newBodyCursorRef.current = null;
      }
    }
  }, [newBody]);

  useEffect(() => {
    const el = editBodyRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = el.scrollHeight + 'px';
      if (editBodyCursorRef.current !== null) {
        el.setSelectionRange(editBodyCursorRef.current, editBodyCursorRef.current);
        editBodyCursorRef.current = null;
      }
    }
  }, [editBody, editingId]);

  const active = prompts.filter(p => !p.trashedAt);
  const trashed = prompts.filter(p => p.trashedAt);
  const allTags = [...new Set(active.flatMap(p => p.tags))];
  const filtered = active
    .filter(p => {
      if (filterMode === 'unsent') return !p.sent;
      if (filterMode === 'sent') return p.sent;
      if (filterMode === 'resolved') return !!p.resolved;
      if (filterMode === 'unresolved') return !p.resolved;
      return true;
    })
    .filter(p => !selectedTag || p.tags.includes(selectedTag));

  // 並べ替えはフィルターなし時のみ有効（バグ防止）
  const canReorder = filterMode === 'all' && !selectedTag;

  useEffect(() => { savePrompts(prompts); }, [prompts]);
  useEffect(() => { saveFilterState({ filterMode, selectedTag }); }, [filterMode, selectedTag]);

  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2000);
  }, []);

  const shotTitle = getShotTitle(active.length);

  // --- Prompt CRUD ---
  const addPrompt = () => {
    if (!newBody.trim()) return;
    const entry: PromptEntry = {
      id: uid(), body: newBody.trim(),
      replies: [], sent: false,
      tags: parseTags(newTags),
      createdAt: Date.now(), updatedAt: Date.now(),
    };
    setPrompts(prev => [entry, ...prev]);
    setNewBody('');
    setNewTags('');
    setShowNewForm(false);
    setFilterMode('all');
    setSelectedTag(null);
    showToast('プロンプト追加 ⚡');
  };

  const handlePaste = (
    setter: (v: string) => void,
    cursorRef: React.MutableRefObject<number | null>,
    e: React.ClipboardEvent<HTMLTextAreaElement>,
  ) => {
    e.preventDefault();
    const paste = e.clipboardData.getData('text/plain');
    const el = e.currentTarget;
    const start = el.selectionStart ?? el.value.length;
    const end = el.selectionEnd ?? el.value.length;
    cursorRef.current = start + paste.length;
    setter(el.value.slice(0, start) + paste + el.value.slice(end));
  };

  const trashPrompt = (id: string) => {
    setPrompts(prev => prev.map(p =>
      p.id === id ? { ...p, trashedAt: Date.now() } : p
    ));
    showToast('ゴミ箱に移動しました');
  };

  const restorePrompt = (id: string) => {
    setPrompts(prev => prev.map(p =>
      p.id === id ? { ...p, trashedAt: undefined } : p
    ));
    showToast('復元しました');
  };

  const deleteForever = (id: string) => {
    setPrompts(prev => prev.filter(p => p.id !== id));
    showToast('完全に削除しました');
  };

  const emptyTrash = () => {
    setPrompts(prev => prev.filter(p => !p.trashedAt));
    setShowTrash(false);
    showToast('ゴミ箱を空にしました');
  };

  const startEdit = (p: PromptEntry) => {
    setEditingId(p.id);
    setEditBody(p.body);
    setEditTags(p.tags.join(', '));
  };

  const saveEdit = (id: string) => {
    setPrompts(prev => prev.map(p =>
      p.id === id
        ? { ...p, body: editBody, tags: parseTags(editTags), updatedAt: Date.now() }
        : p
    ));
    setEditingId(null);
    showToast('保存しました');
  };

  // --- 折りたたみ ---
  const toggleCollapse = (id: string) => {
    setCollapsed(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };
  const collapseAll = () => setCollapsed(new Set(filtered.map(p => p.id)));
  const expandAll = () => setCollapsed(new Set());

  // --- 行単位の並べ替え ---
  const moveLine = (promptId: string, lineIdx: number, direction: 'up' | 'down') => {
    setPrompts(prev => prev.map(p => {
      if (p.id !== promptId) return p;
      const lines = p.body.split('\n');
      const targetIdx = direction === 'up' ? lineIdx - 1 : lineIdx + 1;
      if (targetIdx < 0 || targetIdx >= lines.length) return p;
      const next = [...lines];
      [next[lineIdx], next[targetIdx]] = [next[targetIdx], next[lineIdx]];
      return { ...p, body: next.join('\n') };
    }));
  };

  // --- プロンプト分割 ---
  const splitPrompt = (id: string, lineIndex: number) => {
    setPrompts(prev => {
      const idx = prev.findIndex(p => p.id === id);
      if (idx === -1) return prev;
      const p = prev[idx];
      const lines = p.body.split('\n');
      const top = lines.slice(0, lineIndex + 1).join('\n').trim();
      const bottom = lines.slice(lineIndex + 1).join('\n').trim();
      if (!top || !bottom) return prev;
      const now = Date.now();
      const p1: PromptEntry = { ...p, body: top, updatedAt: now };
      const p2: PromptEntry = {
        ...p, id: uid(), body: bottom,
        createdAt: now, updatedAt: now,
        replies: [], sent: false, resolved: false, inProgress: false,
      };
      const next = [...prev];
      next.splice(idx, 1, p1, p2);
      return next;
    });
    setSplittingId(null);
  };

  // --- 解決済みマーク ---
  const toggleResolved = (id: string) => {
    setPrompts(prev => prev.map(p =>
      p.id === id ? { ...p, resolved: !p.resolved } : p
    ));
    setCollapsed(prev => {
      const next = new Set(prev);
      const target = prompts.find(p => p.id === id);
      if (target?.resolved) {
        next.delete(id); // 解除 → 展開
      } else {
        next.add(id); // 解決済み → 折りたたみ
      }
      return next;
    });
  };

  // --- 作業中マーカー（全体で1件のみ） ---
  const toggleInProgress = (id: string) => {
    setPrompts(prev => prev.map(p => ({
      ...p,
      inProgress: p.id === id ? !p.inProgress : false,
    })));
  };

  // --- 並べ替え ---
  const moveUp = (id: string) => {
    setPrompts(prev => {
      const activeIds = prev.filter(p => !p.trashedAt).map(p => p.id);
      const idx = activeIds.indexOf(id);
      if (idx <= 0) return prev;
      const aboveId = activeIds[idx - 1];
      const iCurr = prev.findIndex(p => p.id === id);
      const iAbove = prev.findIndex(p => p.id === aboveId);
      const next = [...prev];
      [next[iCurr], next[iAbove]] = [next[iAbove], next[iCurr]];
      return next;
    });
  };

  const moveDown = (id: string) => {
    setPrompts(prev => {
      const activeIds = prev.filter(p => !p.trashedAt).map(p => p.id);
      const idx = activeIds.indexOf(id);
      if (idx >= activeIds.length - 1) return prev;
      const belowId = activeIds[idx + 1];
      const iCurr = prev.findIndex(p => p.id === id);
      const iBelow = prev.findIndex(p => p.id === belowId);
      const next = [...prev];
      [next[iCurr], next[iBelow]] = [next[iBelow], next[iCurr]];
      return next;
    });
  };

  const toggleCheckbox = (promptId: string, lineIndex: number) => {
    setPrompts(prev => prev.map(p => {
      if (p.id !== promptId) return p;
      const lines = p.body.split('\n');
      const line = lines[lineIndex];
      if (line.match(/^- \[ \]/)) {
        lines[lineIndex] = line.replace(/^- \[ \]/, '- [x]');
      } else if (line.match(/^- \[x\]/i)) {
        lines[lineIndex] = line.replace(/^- \[x\]/i, '- [ ]');
      }
      return { ...p, body: lines.join('\n') };
    }));
  };

  const toggleSent = (id: string) => {
    setPrompts(prev => prev.map(p =>
      p.id === id ? { ...p, sent: !p.sent } : p
    ));
  };

  // --- Replies ---
  const addReply = (promptId: string) => {
    if (!replyText.trim()) return;
    const reply: Reply = {
      id: uid(), text: replyText.trim(), createdAt: Date.now(), resolved: false,
    };
    setPrompts(prev => prev.map(p =>
      p.id === promptId ? { ...p, replies: [...p.replies, reply] } : p
    ));
    setReplyText(''); setReplyingTo(null);
  };

  const toggleResolve = (promptId: string, replyId: string) => {
    setPrompts(prev => prev.map(p =>
      p.id === promptId
        ? { ...p, replies: p.replies.map(r => r.id === replyId ? { ...r, resolved: !r.resolved } : r) }
        : p
    ));
  };

  const deleteReply = (promptId: string, replyId: string) => {
    setPrompts(prev => prev.map(p =>
      p.id === promptId
        ? { ...p, replies: p.replies.filter(r => r.id !== replyId) }
        : p
    ));
  };

  // --- Import / Export / Distill ---
  const handleExport = () => { exportPrompts(prompts); showToast('エクスポート完了'); };

  const handleImport = async () => {
    try {
      const data = await importPrompts();
      const dupes = findDuplicateIds(data, prompts);
      if (dupes.length > 0) {
        showToast(`インポートブロック: ${dupes.length}件のIDが重複しています`);
        return;
      }
      setPrompts(prev => [...data, ...prev]);
      showToast(`${data.length}件インポートしました`);
    } catch { showToast('インポート失敗'); }
  };

  const handleDistill = async () => {
    if (active.length === 0) { showToast('プロンプトがありません'); return; }
    const ok = await copyToClipboard(buildGlobalDistillPrompt(active));
    showToast(ok ? '蒸留プロンプトをコピー ✨' : 'コピー失敗');
  };

  const formatDate = (ts: number) => {
    const d = new Date(ts);
    return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  return (
    <div className={`oneshot ${dark ? 'dark' : 'light'}`}>
      {/* ===== HEADER ===== */}
      <header className="os-header">
        <div className="os-logo">
          <div className="os-logo-icon"><ZapIcon size={28} /></div>
          <h1>
            <span className="accent">{shotTitle}</span>
            <span className="shot">Shot</span>
          </h1>
          <span className="os-count-badge">{active.length} prompts</span>
        </div>

        <div className="os-toolbar">
          <button className="os-btn os-btn-pink" onClick={handleDistill}>
            <SparklesIcon size={14} /> {shotTitle.toUpperCase()} DISTILL
          </button>

          <button
            className={`os-btn os-btn-ghost ${showTrash ? 'os-btn-trash-active' : ''}`}
            onClick={() => setShowTrash(v => !v)}
            title="ゴミ箱"
          >
            <TrashIcon size={14} />
            {trashed.length > 0 && <span className="os-trash-badge">{trashed.length}</span>}
          </button>

          <button className="os-btn os-btn-ghost" onClick={handleExport}>
            <DownloadIcon size={14} />
          </button>
          <button className="os-btn os-btn-ghost" onClick={handleImport}>
            <UploadIcon size={14} />
          </button>
        </div>
      </header>

      {/* ===== TRASH PANEL ===== */}
      {showTrash && (
        <div className="os-trash-panel">
          <div className="os-trash-panel-header">
            <span>ゴミ箱 ({trashed.length}件)</span>
            {trashed.length > 0 && (
              <button className="os-btn os-btn-sm os-btn-ghost" onClick={emptyTrash}>
                すべて削除
              </button>
            )}
          </div>
          {trashed.length === 0 ? (
            <p className="os-trash-empty">ゴミ箱は空です</p>
          ) : (
            trashed.map(p => (
              <div key={p.id} className="os-trash-item">
                <div className="os-trash-item-body">{p.body.slice(0, 120)}{p.body.length > 120 ? '…' : ''}</div>
                <div className="os-trash-item-actions">
                  <span className="os-trash-date">{formatDate(p.trashedAt!)}</span>
                  <button className="os-btn os-btn-sm os-btn-purple" onClick={() => restorePrompt(p.id)}>
                    <RestoreIcon size={11} /> 復元
                  </button>
                  <button className="os-btn os-btn-sm os-btn-ghost" onClick={() => deleteForever(p.id)}>
                    <TrashIcon size={11} /> 完全削除
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ===== NEW PROMPT ===== */}
      {!showNewForm ? (
        <button
          className="os-btn os-btn-purple"
          onClick={() => setShowNewForm(true)}
          style={{ marginBottom: 16, width: '100%', justifyContent: 'center' }}
        >
          <PlusIcon size={14} /> 新しいプロンプトを追加
        </button>
      ) : (
        <div className="os-new-form">
          <textarea
            ref={newBodyRef}
            className="os-edit-textarea"
            placeholder="プロンプト本文..."
            value={newBody}
            onChange={e => setNewBody(e.target.value)}
            onPaste={e => handlePaste(setNewBody, newBodyCursorRef, e)}
            onKeyDown={e => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') addPrompt(); }}
            autoFocus
          />
          <input
            className="os-tag-input"
            placeholder="タグ（カンマ区切り）"
            value={newTags}
            onChange={e => setNewTags(e.target.value)}
            onKeyDown={e => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') addPrompt(); }}
          />
          <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
            <button className="os-btn os-btn-pink" onClick={addPrompt}>
              <ZapIcon size={14} /> 追加
            </button>
            <button className="os-btn os-btn-ghost" onClick={() => { setShowNewForm(false); setNewTags(''); }}>
              キャンセル
            </button>
          </div>
        </div>
      )}

      {/* ===== FILTER BAR ===== */}
      <div className="os-filter-bar">
        {(['all', 'unsent', 'sent', 'resolved', 'unresolved'] as FilterMode[]).map(mode => (
          <button
            key={mode}
            className={`os-btn os-btn-sm ${filterMode === mode ? 'os-btn-purple' : 'os-btn-ghost'}`}
            onClick={() => setFilterMode(mode)}
          >
            {mode === 'all' ? 'すべて'
              : mode === 'unsent' ? '未送信'
              : mode === 'sent' ? '送信済み'
              : mode === 'resolved' ? '解決済み'
              : '未解決'}
          </button>
        ))}
        {allTags.map(tag => (
          <button
            key={tag}
            className={`os-btn os-btn-sm ${selectedTag === tag ? 'os-btn-pink' : 'os-btn-ghost'}`}
            onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
          >
            #{tag}
          </button>
        ))}
        {filtered.length > 0 && (
          <div className="os-filter-bar-collapse">
            <button className="os-btn os-btn-sm os-btn-ghost" onClick={collapseAll}>全折りたたみ</button>
            <button className="os-btn os-btn-sm os-btn-ghost" onClick={expandAll}>全展開</button>
          </div>
        )}
      </div>

      {/* ===== PROMPT LIST ===== */}
      <div className="os-bubble-list" ref={listRef}>
        {active.length === 0 && (
          <div className="os-empty">
            <div className="os-empty-icon"><ZapIcon size={48} /></div>
            <p><strong>プロンプトがまだありません</strong></p>
            <p>上の「新しいプロンプトを追加」から始めましょう</p>
          </div>
        )}

        {filtered.map(p => {
          const isCollapsed = collapsed.has(p.id) && filterMode !== 'resolved';
          return (
          <div
            key={p.id}
            className={`os-bubble${p.sent ? ' sent' : ''}${p.inProgress ? ' in-progress' : ''}${p.resolved ? ' resolved' : ''}`}
          >
            <div className="os-bubble-meta">
              {p.inProgress && <span className="os-inprogress-badge">▶ 作業中</span>}
              {p.resolved && <span className="os-resolved-badge">✓ 解決済み</span>}
              {p.sent && <span className="os-sent-badge">SENT</span>}
              <span>{formatDate(p.updatedAt)}</span>
              <button
                className="os-btn os-btn-sm os-btn-ghost os-collapse-btn"
                aria-label={isCollapsed ? '展開する' : '折りたたむ'}
                onClick={() => toggleCollapse(p.id)}
              >
                {isCollapsed ? '▶' : '▼'}
              </button>
            </div>

            {!isCollapsed && (editingId === p.id ? (
              <>
                <textarea
                  ref={editBodyRef}
                  className="os-edit-textarea"
                  value={editBody}
                  onChange={e => setEditBody(e.target.value)}
                  onPaste={e => handlePaste(setEditBody, editBodyCursorRef, e)}
                  onKeyDown={e => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') saveEdit(p.id); }}
                  autoFocus
                />
                <input
                  className="os-tag-input"
                  placeholder="タグ（カンマ区切り）"
                  value={editTags}
                  onChange={e => setEditTags(e.target.value)}
                  onKeyDown={e => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') saveEdit(p.id); }}
                />
              </>
            ) : (
              <>
                <div className="os-bubble-body">
                  {(() => {
                    const lines = p.body.split('\n');
                    const isSplitting = splittingId === p.id;
                    return lines.map((line, i) => {
                      const unchecked = line.match(/^- \[ \] (.*)/);
                      const checked = line.match(/^- \[x\] (.*)/i);
                      const bullet = !unchecked && !checked && line.match(/^- (.+)/);
                      const moveable = lines.length > 1;
                      const lineControls = moveable && (
                        <span className="os-line-controls">
                          <button
                            className="os-btn os-btn-sm os-btn-ghost os-line-move-btn"
                            aria-label="行を上に移動"
                            onClick={() => moveLine(p.id, i, 'up')}
                            disabled={i === 0}
                          >↑</button>
                          <button
                            className="os-btn os-btn-sm os-btn-ghost os-line-move-btn"
                            aria-label="行を下に移動"
                            onClick={() => moveLine(p.id, i, 'down')}
                            disabled={i === lines.length - 1}
                          >↓</button>
                        </span>
                      );
                      const lineClass = `os-body-line${moveable ? ' os-body-line--moveable' : ''}`;
                      const splitPoint = isSplitting && i < lines.length - 1 && (
                        <button
                          key={`split-${i}`}
                          className="os-btn os-btn-sm os-btn-ghost os-split-point"
                          onClick={() => splitPrompt(p.id, i)}
                        >
                          ÷ ここで分割
                        </button>
                      );
                      if (unchecked || checked) {
                        return (
                          <div key={i} className={lineClass}>
                            {lineControls}
                            <label className={`os-body-check ${checked ? 'checked' : ''}`} onClick={() => toggleCheckbox(p.id, i)}>
                              <span className="os-body-checkbox"><CheckIcon size={10} /></span>
                              <span>{renderInline((unchecked ?? checked)![1])}</span>
                            </label>
                            {splitPoint}
                          </div>
                        );
                      }
                      if (bullet) {
                        return (
                          <div key={i} className={lineClass}>
                            {lineControls}
                            <div className="os-body-bullet">
                              <span className="os-bullet-char">•</span>
                              <span>{renderInline(bullet[1])}</span>
                            </div>
                            {splitPoint}
                          </div>
                        );
                      }
                      return (
                        <div key={i} className={lineClass}>
                          {lineControls}
                          <div>{line ? renderInline(line) : ' '}</div>
                          {splitPoint}
                        </div>
                      );
                    });
                  })()}
                </div>
                {p.tags.length > 0 && (
                  <div className="os-tags">
                    {p.tags.map(tag => (
                      <span
                        key={tag}
                        className={`os-tag${selectedTag === tag ? ' os-tag-active' : ''}`}
                        onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </>
            ))}

            <div className="os-bubble-actions">
              {editingId === p.id ? (
                <>
                  <button className="os-btn os-btn-sm os-btn-pink" onClick={() => saveEdit(p.id)}>
                    <CheckIcon size={12} /> 保存
                  </button>
                  <button className="os-btn os-btn-sm os-btn-ghost" onClick={() => setEditingId(null)}>
                    キャンセル
                  </button>
                </>
              ) : (
                <>
                  {canReorder && (
                    <>
                      <button
                        className="os-btn os-btn-sm os-btn-ghost"
                        aria-label="上に移動"
                        onClick={() => moveUp(p.id)}
                        disabled={active.indexOf(p) === 0}
                      >↑</button>
                      <button
                        className="os-btn os-btn-sm os-btn-ghost"
                        aria-label="下に移動"
                        onClick={() => moveDown(p.id)}
                        disabled={active.indexOf(p) === active.length - 1}
                      >↓</button>
                    </>
                  )}
                  <button
                    className={`os-btn os-btn-sm ${p.inProgress ? 'os-btn-amber spinning' : 'os-btn-ghost'}`}
                    aria-label={p.inProgress ? '作業中を解除' : '作業中にする'}
                    onClick={() => toggleInProgress(p.id)}
                  >{p.inProgress ? <SpinnerIcon size={12} /> : '▶'}</button>
                  <button
                    className={`os-btn os-btn-sm ${p.resolved ? 'os-btn-green' : 'os-btn-ghost'}`}
                    aria-label={p.resolved ? '解決済みを解除' : '解決済みにする'}
                    onClick={() => toggleResolved(p.id)}
                  >
                    <CheckIcon size={12} />
                  </button>
                  {p.body.split('\n').length > 1 && (
                    <button
                      className={`os-btn os-btn-sm ${splittingId === p.id ? 'os-btn-pink' : 'os-btn-ghost'}`}
                      aria-label="分割"
                      onClick={() => setSplittingId(splittingId === p.id ? null : p.id)}
                    >÷</button>
                  )}
                  <button className="os-btn os-btn-sm os-btn-ghost" aria-label="編集" onClick={() => startEdit(p)}>
                    <EditIcon size={12} />
                  </button>
                  <button
                    className="os-btn os-btn-sm os-btn-ghost"
                    aria-label="コピー"
                    onClick={async () => {
                      const ok = await copyToClipboard(p.body);
                      showToast(ok ? 'コピーしました' : 'コピー失敗');
                    }}
                  >
                    <CopyIcon size={12} />
                  </button>
                  <button
                    className={`os-btn os-btn-sm ${p.sent ? 'os-btn-green' : 'os-btn-ghost'}`}
                    onClick={() => toggleSent(p.id)}
                  >
                    <SendIcon size={12} /> {p.sent ? 'Sent' : 'Mark Sent'}
                  </button>
                  <button className="os-btn os-btn-sm os-btn-purple" onClick={() => setReplyingTo(replyingTo === p.id ? null : p.id)}>
                    <ReplyIcon size={12} /> Reply
                  </button>
                  <button className="os-btn os-btn-sm os-btn-ghost" aria-label="ゴミ箱に移動" onClick={() => trashPrompt(p.id)} style={{ marginLeft: 'auto' }}>
                    <TrashIcon size={12} />
                  </button>
                </>
              )}
            </div>

            {(p.replies.length > 0 || replyingTo === p.id) && (
              <div className="os-replies">
                {p.replies.map(r => (
                  <div key={r.id} className={`os-reply ${r.resolved ? 'resolved' : ''}`}>
                    <button className="os-btn os-btn-sm os-btn-ghost" aria-label="リプライを解決" onClick={() => toggleResolve(p.id, r.id)}>
                      <CheckIcon size={12} />
                    </button>
                    <span className="os-reply-text">{r.text}</span>
                    <button className="os-btn os-btn-sm os-btn-ghost" aria-label="リプライを削除" onClick={() => deleteReply(p.id, r.id)}>
                      <TrashIcon size={10} />
                    </button>
                  </div>
                ))}
                {replyingTo === p.id && (
                  <div className="os-reply-input">
                    <input
                      value={replyText}
                      onChange={e => setReplyText(e.target.value)}
                      placeholder="リプライを入力..."
                      autoFocus
                      onKeyDown={e => { if (e.key === 'Enter') addReply(p.id); }}
                    />
                    <button className="os-btn os-btn-sm os-btn-purple" onClick={() => addReply(p.id)}>
                      <SendIcon size={12} />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
          );
        })}
      </div>

      {showScrollTop && (
        <button className="os-scroll-top" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          ↑
        </button>
      )}

      {toast && <div className="os-toast">{toast}</div>}
    </div>
  );
};

export default OneShot;
