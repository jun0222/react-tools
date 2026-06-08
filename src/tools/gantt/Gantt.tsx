import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import mermaid from 'mermaid';
import { CalendarDays } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import './Gantt.css';

const STORAGE_KEY = 'gantt-data';

interface GanttTask {
  id: string;
  name: string;
  start: string;
  duration: string;
  crit?: boolean;
}

interface GanttSection {
  id: string;
  name: string;
  tasks: GanttTask[];
}

interface GanttData {
  title: string;
  dateFormat: string;
  sections: GanttSection[];
}

let _id = 0;
const uid = () => `g${++_id}`;

const DEFAULT: GanttData = {
  title: 'プロジェクト計画',
  dateFormat: 'YYYY-MM-DD',
  sections: [
    {
      id: uid(),
      name: '設計フェーズ',
      tasks: [
        { id: uid(), name: '要件定義', start: '2024-01-01', duration: '5d' },
        { id: uid(), name: 'アーキテクチャ設計', start: '2024-01-06', duration: '3d', crit: true },
      ],
    },
    {
      id: uid(),
      name: '開発フェーズ',
      tasks: [
        { id: uid(), name: 'バックエンド実装', start: '2024-01-09', duration: '10d' },
        { id: uid(), name: 'フロントエンド実装', start: '2024-01-09', duration: '10d' },
      ],
    },
  ],
};

const load = (): GanttData => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : DEFAULT;
  } catch { return DEFAULT; }
};

const buildCode = (data: GanttData): string => {
  const lines: string[] = [`gantt`, `    title ${data.title}`, `    dateFormat ${data.dateFormat}`];
  for (const sec of data.sections) {
    lines.push(`    section ${sec.name}`);
    for (const task of sec.tasks) {
      const prefix = task.crit ? 'crit, ' : '';
      lines.push(`    ${task.name} :${prefix}${task.start}, ${task.duration}`);
    }
  }
  return lines.join('\n');
};

let renderSeq = 0;

const Gantt = () => {
  const { dark } = useTheme();
  const [data, setData] = useState<GanttData>(load);
  const [hasSvg, setHasSvg] = useState(false);
  const [toast, setToast] = useState('');
  const [showAddSection, setShowAddSection] = useState(false);
  const [newSecName, setNewSecName] = useState('');
  const [addTaskFor, setAddTaskFor] = useState<string | null>(null);
  const [newTask, setNewTask] = useState({ name: '', start: '', duration: '3d', crit: false });
  const previewRef = useRef<HTMLDivElement>(null);
  const svgCache = useRef('');

  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }, [data]);

  const code = useMemo(() => buildCode(data), [data]);

  const showToast = useCallback((msg: string) => {
    setToast(msg); setTimeout(() => setToast(''), 1800);
  }, []);

  const [debounced, setDebounced] = useState(code);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(code), 400);
    return () => clearTimeout(t);
  }, [code]);

  useEffect(() => {
    if (!previewRef.current) return;
    if (!debounced.trim()) {
      previewRef.current.innerHTML = '';
      svgCache.current = '';
      setHasSvg(false);
      return;
    }
    const id = `gt-svg-${++renderSeq}`;
    mermaid.initialize({ startOnLoad: false, theme: dark ? 'dark' : 'default' });
    mermaid.render(id, debounced)
      .then(({ svg }) => {
        if (previewRef.current) {
          previewRef.current.innerHTML = svg;
          svgCache.current = svg;
          setHasSvg(true);
        }
      })
      .catch(() => {
        if (previewRef.current) {
          previewRef.current.innerHTML = '<span style="color:#f87171;font-size:12px">Syntax error</span>';
          svgCache.current = '';
          setHasSvg(false);
        }
      });
  }, [debounced, dark]);

  const addSection = () => {
    if (!newSecName.trim()) return;
    setData(prev => ({ ...prev, sections: [...prev.sections, { id: uid(), name: newSecName.trim(), tasks: [] }] }));
    setNewSecName(''); setShowAddSection(false);
  };

  const removeSection = (sid: string) =>
    setData(prev => ({ ...prev, sections: prev.sections.filter(s => s.id !== sid) }));

  const addTask = (sid: string) => {
    if (!newTask.name.trim() || !newTask.start.trim()) return;
    const task: GanttTask = { id: uid(), name: newTask.name.trim(), start: newTask.start.trim(), duration: newTask.duration.trim() || '3d', crit: newTask.crit };
    setData(prev => ({ ...prev, sections: prev.sections.map(s => s.id === sid ? { ...s, tasks: [...s.tasks, task] } : s) }));
    setNewTask({ name: '', start: '', duration: '3d', crit: false });
    setAddTaskFor(null);
  };

  const removeTask = (sid: string, tid: string) =>
    setData(prev => ({ ...prev, sections: prev.sections.map(s => s.id === sid ? { ...s, tasks: s.tasks.filter(t => t.id !== tid) } : s) }));

  const exportSvg = () => {
    const svg = svgCache.current; if (!svg) return;
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: 'gantt.svg' });
    a.click(); URL.revokeObjectURL(a.href);
    showToast('SVGを保存しました');
  };

  const exportPng = useCallback(() => {
    const svg = svgCache.current; if (!svg) return;
    const wm = svg.match(/width="(\d+(?:\.\d+)?)"/), hm = svg.match(/height="(\d+(?:\.\d+)?)"/);
    const w = wm ? parseFloat(wm[1]) : 900, h = hm ? parseFloat(hm[1]) : 400, scale = 2;
    const svgUrl = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }));
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = w * scale; canvas.height = h * scale;
      const ctx = canvas.getContext('2d'); if (!ctx) return;
      ctx.scale(scale, scale); ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(svgUrl);
      canvas.toBlob(blob => {
        if (!blob) return;
        const pngUrl = URL.createObjectURL(blob);
        const a = Object.assign(document.createElement('a'), { href: pngUrl, download: 'gantt.png' });
        a.click(); URL.revokeObjectURL(pngUrl);
        showToast('PNGを保存しました');
      }, 'image/png');
    };
    img.src = svgUrl;
  }, [showToast]);

  return (
    <div className={`gantt-root ${dark ? 'dark' : 'light'}`}>
      <div className="gt-header">
        <div className="gt-logo-icon"><CalendarDays size={22} color="white" /></div>
        <h1><span className="gt-accent">Gantt</span> Chart</h1>
        {hasSvg && (
          <div className="gt-export-row">
            <button className="gt-btn gt-btn-ghost" onClick={exportSvg}>SVG</button>
            <button className="gt-btn gt-btn-ghost" onClick={exportPng}>PNG</button>
            <button className="gt-btn gt-btn-ghost" onClick={() => { navigator.clipboard.writeText(code); showToast('コピーしました'); }}>コードをコピー</button>
          </div>
        )}
      </div>

      {/* ===== BIG PREVIEW — top half ===== */}
      <div className="gt-preview-wrap">
        {!hasSvg && <div className="gt-preview-empty">ガントチャートがここに表示されます</div>}
        {/* No React children here — mermaid owns this div */}
        <div ref={previewRef} className="gt-preview-inner" />
      </div>

      {/* ===== FORM — bottom half ===== */}
      <div className="gt-form-area">
        <div className="gt-form-row">
          <div className="gt-form-group">
            <span className="gt-form-label">タイトル</span>
            <input className="gt-input" value={data.title} onChange={e => setData(prev => ({ ...prev, title: e.target.value }))} />
          </div>
          <div className="gt-form-group">
            <span className="gt-form-label">日付形式</span>
            <input className="gt-input" value={data.dateFormat} onChange={e => setData(prev => ({ ...prev, dateFormat: e.target.value }))} style={{ width: 140 }} />
          </div>
        </div>

        <div className="gt-sections">
          {data.sections.map(sec => (
            <div key={sec.id} className="gt-section-block">
              <div className="gt-section-header">
                <span className="gt-section-name">● {sec.name}</span>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button className="gt-btn gt-btn-ghost gt-btn-xs" onClick={() => setAddTaskFor(addTaskFor === sec.id ? null : sec.id)}>+ タスク</button>
                  <button className="gt-btn gt-btn-danger gt-btn-xs" onClick={() => removeSection(sec.id)}>✕</button>
                </div>
              </div>

              <div className="gt-task-list">
                {sec.tasks.map(task => (
                  <div key={task.id} className="gt-task-item">
                    {task.crit && <span style={{ color: '#ef4444', fontSize: 10, marginRight: 3 }}>●</span>}
                    <span className="gt-task-name">{task.name}</span>
                    <span className="gt-task-meta">{task.start} / {task.duration}</span>
                    <button className="gt-btn gt-btn-ghost gt-btn-xs" onClick={() => removeTask(sec.id, task.id)}>✕</button>
                  </div>
                ))}

                {addTaskFor === sec.id && (
                  <div className="gt-add-task-form">
                    <input className="gt-input" placeholder="タスク名" value={newTask.name} onChange={e => setNewTask(p => ({ ...p, name: e.target.value }))} />
                    <input className="gt-input" placeholder="開始日 (2024-01-01)" value={newTask.start} onChange={e => setNewTask(p => ({ ...p, start: e.target.value }))} style={{ width: 150 }} />
                    <input className="gt-input" placeholder="期間 (3d)" value={newTask.duration} onChange={e => setNewTask(p => ({ ...p, duration: e.target.value }))} style={{ width: 80 }} />
                    <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--gt-muted)', cursor: 'pointer' }}>
                      <input type="checkbox" checked={newTask.crit} onChange={e => setNewTask(p => ({ ...p, crit: e.target.checked }))} />
                      crit
                    </label>
                    <button className="gt-btn gt-btn-primary" onClick={() => addTask(sec.id)} disabled={!newTask.name.trim() || !newTask.start.trim()}>追加</button>
                    <button className="gt-btn gt-btn-ghost" onClick={() => setAddTaskFor(null)}>✕</button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {showAddSection ? (
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <input className="gt-input" placeholder="セクション名" value={newSecName} onChange={e => setNewSecName(e.target.value)} onKeyDown={e => e.key === 'Enter' && addSection()} autoFocus style={{ maxWidth: 260 }} />
              <button className="gt-btn gt-btn-primary" onClick={addSection} disabled={!newSecName.trim()}>追加</button>
              <button className="gt-btn gt-btn-ghost" onClick={() => setShowAddSection(false)}>キャンセル</button>
            </div>
          ) : (
            <button className="gt-btn gt-btn-ghost" style={{ alignSelf: 'flex-start' }} onClick={() => setShowAddSection(true)}>+ セクションを追加</button>
          )}
        </div>
      </div>

      {toast && <div className="gt-toast">{toast}</div>}
    </div>
  );
};

export default Gantt;
