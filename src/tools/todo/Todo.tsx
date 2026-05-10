import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import {
  parseTodoTxt, serializeTodoItem, serializeTodoTxt,
  toggleDone, sortItems, newId, parseTodoLine,
} from './todoCore';
import type { TodoItem } from './todoCore';
import './Todo.css';

const STORAGE_KEY = 'todo-items';

const loadItems = (): TodoItem[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as TodoItem[];
  } catch { /* ignore */ }
  return [];
};

const saveItems = (items: TodoItem[]) => {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); } catch { /* ignore */ }
};

const PRIORITY_OPTIONS = ['', 'A', 'B', 'C', 'D', 'E'] as const;

type ViewTab = 'all' | 'active' | 'done';

const renderText = (text: string) => {
  const parts = text.split(/(\+\S+|@\S+)/g);
  return parts.map((p, i) => {
    if (p.startsWith('+')) return <span key={i} className="td-project">{p}</span>;
    if (p.startsWith('@')) return <span key={i} className="td-context">{p}</span>;
    return <span key={i}>{p}</span>;
  });
};

const Todo = () => {
  const { dark } = useTheme();
  const [items, setItems] = useState<TodoItem[]>(() => loadItems());
  const [tab, setTab] = useState<ViewTab>('all');
  const [filterProjects, setFilterProjects] = useState<Set<string>>(new Set());
  const [filterContexts, setFilterContexts] = useState<Set<string>>(new Set());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [toast, setToast] = useState('');
  const [showIo, setShowIo] = useState(false);
  const [ioText, setIoText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Add form
  const [addText, setAddText] = useState('');
  const [addPriority, setAddPriority] = useState('');
  const [addProjects, setAddProjects] = useState('');
  const [addContexts, setAddContexts] = useState('');

  useEffect(() => { saveItems(items); }, [items]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 1800);
  }, []);

  const allProjects = useMemo(() =>
    [...new Set(items.flatMap(i => i.projects))].sort(), [items]);
  const allContexts = useMemo(() =>
    [...new Set(items.flatMap(i => i.contexts))].sort(), [items]);

  const visibleItems = useMemo(() => {
    let result = items;
    if (tab === 'active') result = result.filter(i => !i.done);
    if (tab === 'done') result = result.filter(i => i.done);
    if (filterProjects.size > 0)
      result = result.filter(i => i.projects.some(p => filterProjects.has(p)));
    if (filterContexts.size > 0)
      result = result.filter(i => i.contexts.some(c => filterContexts.has(c)));
    return sortItems(result);
  }, [items, tab, filterProjects, filterContexts]);

  const counts = useMemo(() => ({
    all: items.length,
    active: items.filter(i => !i.done).length,
    done: items.filter(i => i.done).length,
  }), [items]);

  const handleAdd = () => {
    const text = addText.trim();
    if (!text) return;
    const parts: string[] = [];
    if (addPriority) parts.push(`(${addPriority})`);
    parts.push(text);
    if (addProjects) addProjects.split(/\s+/).filter(Boolean).forEach(p => parts.push(`+${p.replace(/^\+/, '')}`));
    if (addContexts) addContexts.split(/\s+/).filter(Boolean).forEach(c => parts.push(`@${c.replace(/^@/, '')}`));
    const raw = parts.join(' ');
    const item = parseTodoLine(raw, newId());
    setItems(prev => [item, ...prev]);
    setAddText('');
    setAddProjects('');
    setAddContexts('');
    setAddPriority('');
  };

  const handleToggle = (id: string) => {
    setItems(prev => prev.map(i => i.id === id ? toggleDone(i) : i));
  };

  const handleDelete = (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const startEdit = (item: TodoItem) => {
    setEditingId(item.id);
    setEditText(serializeTodoItem(item));
  };

  const commitEdit = (id: string) => {
    const text = editText.trim();
    if (text) {
      setItems(prev => prev.map(i => {
        if (i.id !== id) return i;
        return { ...parseTodoLine(text, id) };
      }));
    }
    setEditingId(null);
  };

  const handleImport = () => {
    const imported = parseTodoTxt(ioText);
    if (!imported.length) return;
    setItems(imported);
    setIoText('');
    setShowIo(false);
    showToast(`${imported.length} 件インポートしました`);
  };

  const handleExport = () => {
    const text = serializeTodoTxt(sortItems(items));
    setIoText(text);
    setShowIo(true);
  };

  const handleDownload = () => {
    const text = serializeTodoTxt(sortItems(items));
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const ts = `${d.getFullYear()}_${pad(d.getMonth()+1)}_${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}_${pad(d.getSeconds())}`;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `todo_${ts}.txt`; a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const text = ev.target?.result as string;
      const imported = parseTodoTxt(text);
      setItems(imported);
      showToast(`${imported.length} 件読み込みました`);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const toggleFilter = (set: Set<string>, value: string, setter: (s: Set<string>) => void) => {
    const next = new Set(set);
    next.has(value) ? next.delete(value) : next.add(value);
    setter(next);
  };

  return (
    <div className={`todo ${dark ? 'dark' : 'light'}`}>
      {/* Header */}
      <div className="td-header">
        <div className="td-header-left">
          <div className="td-logo-icon">✅</div>
          <h1><span className="accent">Todo</span></h1>
          <span className="td-summary">{counts.active} / {counts.all} 件</span>
        </div>
        <div className="td-header-actions">
          <button className="td-btn td-btn-ghost td-btn-sm" onClick={() => fileInputRef.current?.click()}>
            📂 開く
          </button>
          <input ref={fileInputRef} type="file" className="td-file-input" accept=".txt,text/plain" onChange={handleFileUpload} />
          <button className="td-btn td-btn-ghost td-btn-sm" onClick={handleExport}>エクスポート</button>
          <button className="td-btn td-btn-ghost td-btn-sm" onClick={handleDownload}>DL</button>
        </div>
      </div>

      {/* Add form */}
      <div className="td-add-form">
        <div className="td-add-row">
          <input
            className="td-add-text"
            type="text"
            placeholder="新しいタスクを入力… （Enter で追加）"
            value={addText}
            onChange={e => setAddText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleAdd(); }}
            aria-label="新しいタスク"
          />
          <button className="td-btn td-btn-primary" onClick={handleAdd} disabled={!addText.trim()}>
            追加
          </button>
        </div>
        <div className="td-add-meta">
          <select
            className="td-add-select"
            value={addPriority}
            onChange={e => setAddPriority(e.target.value)}
            aria-label="優先度"
          >
            <option value="">優先度なし</option>
            {PRIORITY_OPTIONS.filter(Boolean).map(p => (
              <option key={p} value={p}>({p}) 優先度 {p}</option>
            ))}
          </select>
          <input
            className="td-add-tag-input"
            type="text"
            placeholder="+Project（スペース区切りで複数）"
            value={addProjects}
            onChange={e => setAddProjects(e.target.value)}
            aria-label="プロジェクト"
          />
          <input
            className="td-add-tag-input"
            type="text"
            placeholder="@context（スペース区切りで複数）"
            value={addContexts}
            onChange={e => setAddContexts(e.target.value)}
            aria-label="コンテキスト"
          />
        </div>
      </div>

      {/* Toolbar: tabs + filters */}
      <div className="td-toolbar">
        <div className="td-tabs">
          {(['all', 'active', 'done'] as const).map(t => (
            <button
              key={t}
              className={`td-tab ${tab === t ? 'td-tab-active' : ''}`}
              onClick={() => setTab(t)}
            >
              {t === 'all' ? `すべて (${counts.all})` : t === 'active' ? `未完了 (${counts.active})` : `完了 (${counts.done})`}
            </button>
          ))}
        </div>

        {(allProjects.length > 0 || allContexts.length > 0) && (
          <div className="td-filters">
            {allProjects.map(p => (
              <button
                key={p}
                className={`td-chip td-chip-project ${filterProjects.has(p) ? 'td-chip-active' : ''}`}
                onClick={() => toggleFilter(filterProjects, p, setFilterProjects)}
              >
                +{p}
              </button>
            ))}
            {allContexts.map(c => (
              <button
                key={c}
                className={`td-chip td-chip-context ${filterContexts.has(c) ? 'td-chip-active' : ''}`}
                onClick={() => toggleFilter(filterContexts, c, setFilterContexts)}
              >
                @{c}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Task list */}
      <div className="td-list">
        {visibleItems.length === 0 ? (
          <div className="td-empty">
            {items.length === 0
              ? 'タスクがありません。追加してみましょう。'
              : 'この条件に一致するタスクはありません。'}
          </div>
        ) : visibleItems.map(item => (
          <div key={item.id} className={`td-card ${item.done ? 'done' : ''}`}>
            {/* Priority bar */}
            <div className={`td-priority-bar${item.priority ? ` pri-${item.priority}` : ''}`} />

            {/* Checkbox */}
            <div
              className={`td-checkbox ${item.done ? 'checked' : ''}`}
              role="checkbox"
              aria-checked={item.done}
              tabIndex={0}
              onClick={() => handleToggle(item.id)}
              onKeyDown={e => { if (e.key === ' ' || e.key === 'Enter') handleToggle(item.id); }}
            />

            {/* Body */}
            <div className="td-card-body">
              {editingId === item.id ? (
                <div className="td-edit-row">
                  <input
                    className="td-edit-input"
                    value={editText}
                    onChange={e => setEditText(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') commitEdit(item.id);
                      if (e.key === 'Escape') setEditingId(null);
                    }}
                    autoFocus
                    aria-label="タスクを編集"
                  />
                  <button className="td-btn td-btn-primary td-btn-sm" onClick={() => commitEdit(item.id)}>保存</button>
                  <button className="td-btn td-btn-ghost td-btn-sm" onClick={() => setEditingId(null)}>✕</button>
                </div>
              ) : (
                <>
                  <div className="td-task-text">{renderText(item.text)}</div>
                  <div className="td-card-meta">
                    {item.priority && (
                      <span className={`td-priority-badge pri-${item.priority}`}>{item.priority}</span>
                    )}
                    {item.tags['due'] && (
                      <span className="td-tag-due">due: {item.tags['due']}</span>
                    )}
                    {item.creationDate && (
                      <span className="td-date">{item.creationDate}</span>
                    )}
                    {item.done && item.completionDate && (
                      <span className="td-date">完了: {item.completionDate}</span>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Actions */}
            {editingId !== item.id && (
              <div className="td-card-actions">
                <button
                  className="td-btn td-btn-ghost td-btn-icon"
                  onClick={() => startEdit(item)}
                  aria-label="編集"
                  title="編集"
                >✏️</button>
                <button
                  className="td-btn td-btn-danger td-btn-icon"
                  onClick={() => handleDelete(item.id)}
                  aria-label="削除"
                  title="削除"
                >✕</button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Import/Export panel */}
      {showIo && (
        <div className="td-io-panel">
          <div className="td-io-title">todo.txt インポート / エクスポート</div>
          <textarea
            className="td-io-textarea"
            placeholder={'(A) タスク名 +Project @context\nx 2026-05-01 完了済みタスク'}
            value={ioText}
            onChange={e => setIoText(e.target.value)}
            rows={8}
            aria-label="todo.txt テキスト"
          />
          <div className="td-io-actions">
            <button className="td-btn td-btn-primary td-btn-sm" onClick={handleImport} disabled={!ioText.trim()}>
              インポート（上書き）
            </button>
            <button className="td-btn td-btn-ghost td-btn-sm" onClick={async () => {
              await navigator.clipboard.writeText(ioText).catch(() => {});
              showToast('コピーしました');
            }}>
              コピー
            </button>
            <button className="td-btn td-btn-ghost td-btn-sm" onClick={() => setShowIo(false)}>閉じる</button>
          </div>
        </div>
      )}

      {toast && <div className="td-toast">{toast}</div>}
    </div>
  );
};

export default Todo;