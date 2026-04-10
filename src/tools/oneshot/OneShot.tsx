import { useState, useEffect, useRef, useCallback } from 'react';
import type { PromptEntry, Reply } from './helpers';
import {
  getShotTitle, loadPrompts, savePrompts, uid,
  exportPrompts, importPrompts, findDuplicateIds, buildGlobalDistillPrompt,
  copyToClipboard,
} from './helpers';

interface Props { dark: boolean; onToggleTheme: () => void; }
import {
  ZapIcon, CopyIcon, PlusIcon, TrashIcon, EditIcon,
  SendIcon, CheckIcon, ReplyIcon, DownloadIcon, UploadIcon,
  SparklesIcon, SunIcon, MoonIcon, RestoreIcon,
} from './icons';
import './OneShot.css';

const OneShot = ({ dark, onToggleTheme }: Props) => {
  const [prompts, setPrompts] = useState<PromptEntry[]>(loadPrompts);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newBody, setNewBody] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBody, setEditBody] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [showTrash, setShowTrash] = useState(false);
  const [toast, setToast] = useState('');
  const [showScrollTop, setShowScrollTop] = useState(false);

  const listRef = useRef<HTMLDivElement>(null);

  const active = prompts.filter(p => !p.trashedAt);
  const trashed = prompts.filter(p => p.trashedAt);

  useEffect(() => { savePrompts(prompts); }, [prompts]);

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
      createdAt: Date.now(), updatedAt: Date.now(),
    };
    setPrompts(prev => [entry, ...prev]);
    setNewBody(''); setShowNewForm(false);
    showToast('プロンプト追加 ⚡');
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

  const startEdit = (p: PromptEntry) => { setEditingId(p.id); setEditBody(p.body); };

  const saveEdit = (id: string) => {
    setPrompts(prev => prev.map(p =>
      p.id === id ? { ...p, body: editBody, updatedAt: Date.now() } : p
    ));
    setEditingId(null);
    showToast('保存しました');
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
          <button className="os-btn os-btn-ghost" onClick={onToggleTheme} title="テーマ切替">
            {dark ? <SunIcon size={14} /> : <MoonIcon size={14} />}
          </button>

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
            className="os-edit-textarea"
            placeholder="プロンプト本文..."
            value={newBody}
            onChange={e => setNewBody(e.target.value)}
            autoFocus
          />
          <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
            <button className="os-btn os-btn-pink" onClick={addPrompt}>
              <ZapIcon size={14} /> 追加
            </button>
            <button className="os-btn os-btn-ghost" onClick={() => setShowNewForm(false)}>
              キャンセル
            </button>
          </div>
        </div>
      )}

      {/* ===== PROMPT LIST ===== */}
      <div className="os-bubble-list" ref={listRef}>
        {active.length === 0 && (
          <div className="os-empty">
            <div className="os-empty-icon"><ZapIcon size={48} /></div>
            <p><strong>プロンプトがまだありません</strong></p>
            <p>上の「新しいプロンプトを追加」から始めましょう</p>
          </div>
        )}

        {active.map(p => (
          <div key={p.id} className={`os-bubble ${p.sent ? 'sent' : ''}`}>
            <div className="os-bubble-meta">
              {p.sent && <span className="os-sent-badge">SENT</span>}
              <span>{formatDate(p.updatedAt)}</span>
            </div>

            {editingId === p.id ? (
              <textarea
                className="os-edit-textarea"
                value={editBody}
                onChange={e => setEditBody(e.target.value)}
                autoFocus
              />
            ) : (
              <div className="os-bubble-body">
                {p.body.split('\n').map((line, i) => {
                  const unchecked = line.match(/^- \[ \] (.*)/);
                  const checked = line.match(/^- \[x\] (.*)/i);
                  if (unchecked || checked) {
                    return (
                      <label key={i} className={`os-body-check ${checked ? 'checked' : ''}`} onClick={() => toggleCheckbox(p.id, i)}>
                        <span className="os-body-checkbox"><CheckIcon size={10} /></span>
                        <span>{(unchecked ?? checked)![1]}</span>
                      </label>
                    );
                  }
                  return <div key={i}>{line || '\u00A0'}</div>;
                })}
              </div>
            )}

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
                  <button className="os-btn os-btn-sm os-btn-ghost" onClick={() => startEdit(p)}>
                    <EditIcon size={12} />
                  </button>
                  <button
                    className="os-btn os-btn-sm os-btn-ghost"
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
                  <button className="os-btn os-btn-sm os-btn-ghost" onClick={() => trashPrompt(p.id)} style={{ marginLeft: 'auto' }}>
                    <TrashIcon size={12} />
                  </button>
                </>
              )}
            </div>

            {(p.replies.length > 0 || replyingTo === p.id) && (
              <div className="os-replies">
                {p.replies.map(r => (
                  <div key={r.id} className={`os-reply ${r.resolved ? 'resolved' : ''}`}>
                    <button className="os-btn os-btn-sm os-btn-ghost" onClick={() => toggleResolve(p.id, r.id)}>
                      <CheckIcon size={12} />
                    </button>
                    <span className="os-reply-text">{r.text}</span>
                    <button className="os-btn os-btn-sm os-btn-ghost" onClick={() => deleteReply(p.id, r.id)}>
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
        ))}
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