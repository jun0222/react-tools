import { useState, useEffect, useRef, useCallback } from 'react';
import type { PromptEntry, Reply, CheckItem } from './helpers';

type ViewMode = 'prompt' | 'verify';

import {
  getShotTitle, loadPrompts, savePrompts, uid,
  exportPrompts, importPrompts, buildGlobalDistillPrompt,
  parseChecklist, copyToClipboard,
} from './helpers';
import {
  ZapIcon, CopyIcon, PlusIcon, TrashIcon, EditIcon,
  SendIcon, CheckIcon, ReplyIcon, DownloadIcon, UploadIcon,
  SparklesIcon, ListCheckIcon,
} from './icons';
import './OneShot.css';

const OneShot = () => {
  const [prompts, setPrompts] = useState<PromptEntry[]>(loadPrompts);
  const [mode, setMode] = useState<ViewMode>('prompt');
  const [showNewForm, setShowNewForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newBody, setNewBody] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editBody, setEditBody] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [toast, setToast] = useState('');
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Verify mode
  const [verifyText, setVerifyText] = useState('');
  const [checkItems, setCheckItems] = useState<CheckItem[]>([]);

  const listRef = useRef<HTMLDivElement>(null);

  // Persist
  useEffect(() => { savePrompts(prompts); }, [prompts]);

  // Scroll watcher
  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2000);
  }, []);

  const shotTitle = getShotTitle(prompts.length);

  // --- Prompt CRUD ---
  const addPrompt = () => {
    if (!newTitle.trim() || !newBody.trim()) return;
    const entry: PromptEntry = {
      id: uid(), title: newTitle.trim(), body: newBody.trim(),
      replies: [], sent: false,
      createdAt: Date.now(), updatedAt: Date.now(),
    };
    setPrompts(prev => [entry, ...prev]);
    setNewTitle(''); setNewBody(''); setShowNewForm(false);
    showToast('プロンプト追加 ⚡');
  };

  const deletePrompt = (id: string) => {
    setPrompts(prev => prev.filter(p => p.id !== id));
    showToast('削除しました');
  };

  const startEdit = (p: PromptEntry) => {
    setEditingId(p.id); setEditTitle(p.title); setEditBody(p.body);
  };

  const saveEdit = (id: string) => {
    setPrompts(prev => prev.map(p =>
      p.id === id ? { ...p, title: editTitle, body: editBody, updatedAt: Date.now() } : p
    ));
    setEditingId(null);
    showToast('保存しました');
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
      setPrompts(prev => [...data, ...prev]);
      showToast(`${data.length}件インポートしました`);
    } catch { showToast('インポート失敗'); }
  };

  const handleDistill = async () => {
    if (prompts.length === 0) { showToast('プロンプトがありません'); return; }
    const text = buildGlobalDistillPrompt(prompts);
    const ok = await copyToClipboard(text);
    showToast(ok ? '蒸留プロンプトをコピー ✨' : 'コピー失敗');
  };

  // --- Verify Mode ---
  const handleParseChecklist = () => {
    setCheckItems(parseChecklist(verifyText));
  };

  const toggleCheck = (id: string) => {
    setCheckItems(prev => prev.map(item =>
      item.id === id ? { ...item, checked: !item.checked } : item
    ));
  };

  const formatDate = (ts: number) => {
    const d = new Date(ts);
    return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  return (
    <div className="oneshot">
      {/* ===== HEADER ===== */}
      <header className="os-header">
        <div className="os-logo">
          <div className="os-logo-icon"><ZapIcon size={28} /></div>
          <h1>
            <span className="accent">{shotTitle}</span>
            <span className="shot">Shot</span>
          </h1>
          <span className="os-count-badge">{prompts.length} prompts</span>
        </div>

        <div className="os-toolbar">
          <div className="os-mode-toggle">
            <button className={mode === 'prompt' ? 'active' : ''} onClick={() => setMode('prompt')}>
              <ZapIcon size={12} /> Prompt
            </button>
            <button className={mode === 'verify' ? 'active' : ''} onClick={() => setMode('verify')}>
              <ListCheckIcon size={12} /> Verify
            </button>
          </div>

          <button className="os-btn os-btn-pink" onClick={handleDistill}>
            <SparklesIcon size={14} /> {shotTitle.toUpperCase()} DISTILL
          </button>

          <button className="os-btn os-btn-ghost" onClick={handleExport}>
            <DownloadIcon size={14} />
          </button>
          <button className="os-btn os-btn-ghost" onClick={handleImport}>
            <UploadIcon size={14} />
          </button>
        </div>
      </header>

      {/* ===== PROMPT MODE ===== */}
      {mode === 'prompt' && (
        <>
          {/* New Prompt */}
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
              <input
                className="os-edit-input"
                placeholder="タイトル..."
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                autoFocus
              />
              <textarea
                className="os-edit-textarea"
                placeholder="プロンプト本文..."
                value={newBody}
                onChange={e => setNewBody(e.target.value)}
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

          {/* Prompt List */}
          <div className="os-bubble-list" ref={listRef}>
            {prompts.length === 0 && (
              <div className="os-empty">
                <div className="os-empty-icon"><ZapIcon size={48} /></div>
                <p><strong>プロンプトがまだありません</strong></p>
                <p>上の「新しいプロンプトを追加」から始めましょう</p>
              </div>
            )}

            {prompts.map(p => (
              <div key={p.id} className={`os-bubble ${p.sent ? 'sent' : ''}`}>
                {/* Header */}
                <div className="os-bubble-header">
                  {editingId === p.id ? (
                    <input
                      className="os-edit-input"
                      value={editTitle}
                      onChange={e => setEditTitle(e.target.value)}
                      autoFocus
                    />
                  ) : (
                    <h3 className="os-bubble-title">{p.title}</h3>
                  )}
                  <div className="os-bubble-meta">
                    {p.sent && <span className="os-sent-badge">SENT</span>}
                    <span>{formatDate(p.updatedAt)}</span>
                  </div>
                </div>

                {/* Body */}
                {editingId === p.id ? (
                  <textarea
                    className="os-edit-textarea"
                    value={editBody}
                    onChange={e => setEditBody(e.target.value)}
                  />
                ) : (
                  <div className="os-bubble-body">{p.body}</div>
                )}

                {/* Actions */}
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
                      <button className="os-btn os-btn-sm os-btn-ghost" onClick={() => deletePrompt(p.id)} style={{ marginLeft: 'auto' }}>
                        <TrashIcon size={12} />
                      </button>
                    </>
                  )}
                </div>

                {/* Replies */}
                {(p.replies.length > 0 || replyingTo === p.id) && (
                  <div className="os-replies">
                    {p.replies.map(r => (
                      <div key={r.id} className={`os-reply ${r.resolved ? 'resolved' : ''}`}>
                        <button
                          className="os-btn os-btn-sm os-btn-ghost"
                          onClick={() => toggleResolve(p.id, r.id)}
                          title={r.resolved ? 'Unresolve' : 'Resolve'}
                        >
                          <CheckIcon size={12} />
                        </button>
                        <span className="os-reply-text">{r.text}</span>
                        <button
                          className="os-btn os-btn-sm os-btn-ghost"
                          onClick={() => deleteReply(p.id, r.id)}
                        >
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
        </>
      )}

      {/* ===== VERIFY MODE ===== */}
      {mode === 'verify' && (
        <div className="os-verify">
          <h3 style={{ color: '#fff', margin: '0 0 12px', fontSize: 16, fontWeight: 800 }}>
            🔍 AI出力を貼り付けてチェックリスト化
          </h3>
          <textarea
            className="os-verify-input"
            placeholder={'AIの出力をここに貼り付け…\n箇条書き（- / * / 1. など）を自動検出します'}
            value={verifyText}
            onChange={e => setVerifyText(e.target.value)}
          />
          <button className="os-btn os-btn-pink" onClick={handleParseChecklist} style={{ marginBottom: 16 }}>
            <ListCheckIcon size={14} /> チェックリスト生成
          </button>

          {checkItems.length > 0 && (
            <>
              <div style={{ fontSize: 11, color: 'var(--os-text-dim)', marginBottom: 8 }}>
                {checkItems.filter(i => i.checked).length} / {checkItems.length} completed
              </div>
              <ul className="os-checklist">
                {checkItems.map(item => (
                  <li
                    key={item.id}
                    className={`os-check-item ${item.checked ? 'checked' : ''}`}
                    onClick={() => toggleCheck(item.id)}
                  >
                    <span className="os-checkbox"><CheckIcon size={12} /></span>
                    <span className="os-check-label">{item.text}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}

      {/* ===== SCROLL TO TOP ===== */}
      {showScrollTop && (
        <button className="os-scroll-top" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          ↑
        </button>
      )}

      {/* ===== TOAST ===== */}
      {toast && <div className="os-toast">{toast}</div>}
    </div>
  );
};

export default OneShot;