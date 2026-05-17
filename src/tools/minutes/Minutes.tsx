import { useState, useCallback, useEffect, useRef } from 'react';
import { ClipboardList } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import {
  emptyMeeting, newAgendaItem, newAction, generateMarkdown,
} from './minutesCore';
import type { MeetingData, AgendaItem, ActionItem } from './minutesCore';
import './Minutes.css';

const STORAGE_KEY = 'minutes-state';

const load = (): MeetingData => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as MeetingData;
  } catch { /* ignore */ }
  return emptyMeeting();
};

const timestamp = () => {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}_${p(d.getMonth()+1)}_${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}_${p(d.getSeconds())}`;
};

const Minutes = () => {
  const { dark } = useTheme();
  const [data, setData] = useState<MeetingData>(load);
  const [toast, setToast] = useState('');

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch { /* ignore */ }
  }, [data]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 1800);
  }, []);

  const md = generateMarkdown(data);
  const mdRef = useRef(md);
  useEffect(() => { mdRef.current = md; }, [md]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        navigator.clipboard.writeText(mdRef.current).then(
          () => showToast('コピーしました'),
          () => showToast('コピー失敗'),
        );
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [showToast]);

  const setMeta = (key: keyof MeetingData, value: string) =>
    setData(prev => ({ ...prev, [key]: value }));

  const updateAgenda = (id: string, key: keyof AgendaItem, value: string) =>
    setData(prev => ({
      ...prev,
      agendaItems: prev.agendaItems.map(a => a.id === id ? { ...a, [key]: value } : a),
    }));

  const addAgenda = () =>
    setData(prev => ({ ...prev, agendaItems: [...prev.agendaItems, newAgendaItem()] }));

  const removeAgenda = (id: string) =>
    setData(prev => ({ ...prev, agendaItems: prev.agendaItems.filter(a => a.id !== id) }));

  const updateAction = (agendaId: string, actionId: string, key: keyof ActionItem, value: string) =>
    setData(prev => ({
      ...prev,
      agendaItems: prev.agendaItems.map(a =>
        a.id === agendaId
          ? { ...a, actions: a.actions.map(ac => ac.id === actionId ? { ...ac, [key]: value } : ac) }
          : a
      ),
    }));

  const addAction = (agendaId: string) =>
    setData(prev => ({
      ...prev,
      agendaItems: prev.agendaItems.map(a =>
        a.id === agendaId ? { ...a, actions: [...a.actions, newAction()] } : a
      ),
    }));

  const removeAction = (agendaId: string, actionId: string) =>
    setData(prev => ({
      ...prev,
      agendaItems: prev.agendaItems.map(a =>
        a.id === agendaId
          ? { ...a, actions: a.actions.filter(ac => ac.id !== actionId) }
          : a
      ),
    }));

  const copy = async () => {
    try { await navigator.clipboard.writeText(md); showToast('コピーしました'); }
    catch { showToast('コピー失敗'); }
  };

  const download = () => {
    const blob = new Blob([md], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `minutes_${timestamp()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const reset = () => {
    setData(emptyMeeting());
    localStorage.removeItem(STORAGE_KEY);
    showToast('リセットしました');
  };

  return (
    <div className={`minutes ${dark ? 'dark' : 'light'}`}>
      <div className="mn-header">
        <div className="mn-logo-icon"><ClipboardList size={22} color="white" /></div>
        <h1><span className="accent">Minutes</span></h1>
      </div>

      <div className="mn-layout">
        {/* ===== LEFT: Meeting meta ===== */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="mn-panel">
            <div className="mn-panel-title">会議情報</div>
            <div className="mn-field-row">
              <label className="mn-field-label">会議名</label>
              <input className="mn-input" placeholder="週次定例 / 方針決定会議 …" value={data.title} onChange={e => setMeta('title', e.target.value)} aria-label="会議名" />
            </div>
            <div className="mn-field-row">
              <label className="mn-field-label">日時</label>
              <input className="mn-input" placeholder="2026-05-11 10:00" value={data.date} onChange={e => setMeta('date', e.target.value)} aria-label="日時" />
            </div>
            <div className="mn-field-row">
              <label className="mn-field-label">参加者</label>
              <input className="mn-input" placeholder="Alice, Bob, Carol" value={data.participants} onChange={e => setMeta('participants', e.target.value)} aria-label="参加者" />
            </div>
            <div className="mn-field-row">
              <label className="mn-field-label">会議の目的</label>
              <textarea className="mn-textarea" rows={2} placeholder="この会議で何を決めるか" value={data.objective} onChange={e => setMeta('objective', e.target.value)} aria-label="会議の目的" />
            </div>
          </div>

          {/* Tip */}
          <div className="mn-panel" style={{ fontSize: 11, color: 'var(--mn-text-dim)', lineHeight: 1.6 }}>
            <strong style={{ color: 'var(--mn-text)' }}>コンサル議事録のコツ</strong><br />
            <span style={{ color: 'var(--mn-indigo)', fontWeight: 600 }}>MECE</span> で議論を網羅・重複なく整理する<br />
            <span style={{ color: 'var(--mn-indigo)', fontWeight: 600 }}>So What?</span> — 決定事項は必ず意思決定まで落とす<br />
            <span style={{ color: 'var(--mn-indigo)', fontWeight: 600 }}>5W1H</span> でネクストアクションを明確にする<br />
            <span style={{ color: 'var(--mn-indigo)', fontWeight: 600 }}>担当者 × 期日</span> が決まって初めてアクションになる
          </div>
        </div>

        {/* ===== RIGHT: Agenda + Output ===== */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="mn-panel">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div className="mn-panel-title" style={{ marginBottom: 0 }}>アジェンダ</div>
              <button className="mn-btn mn-btn-ghost mn-btn-sm" onClick={addAgenda}>＋ 議題追加</button>
            </div>

            <div className="mn-agenda-list">
              {data.agendaItems.map((item, idx) => (
                <div key={item.id} className="mn-agenda-item">
                  <div className="mn-agenda-item-header">
                    <span className="mn-agenda-num">{idx + 1}.</span>
                    <input
                      className="mn-input"
                      placeholder="議題タイトル"
                      value={item.title}
                      onChange={e => updateAgenda(item.id, 'title', e.target.value)}
                      aria-label={`議題 ${idx + 1} タイトル`}
                    />
                    <button className="mn-btn mn-btn-danger mn-btn-sm" onClick={() => removeAgenda(item.id)} disabled={data.agendaItems.length === 1} aria-label="議題を削除">✕</button>
                  </div>

                  <div className="mn-field-row">
                    <label className="mn-field-label">議論ポイント</label>
                    <textarea className="mn-textarea" rows={2} placeholder={'課題・重要な観点を箇条書きで（1行1項目）\nMECEに漏れ・ダブりなく整理する'} value={item.discussion} onChange={e => updateAgenda(item.id, 'discussion', e.target.value)} />
                  </div>

                  <div className="mn-field-row">
                    <label className="mn-field-label">決定事項</label>
                    <textarea className="mn-textarea" rows={2} placeholder={'この議題で決まったことを箇条書きで\nSo What? — 意思決定まで落とす'} value={item.decisions} onChange={e => updateAgenda(item.id, 'decisions', e.target.value)} />
                  </div>

                  <div className="mn-field-row">
                    <label className="mn-field-label">ネクストアクション</label>
                    <div className="mn-action-header">
                      <span>アクション</span>
                      <span>担当者</span>
                      <span>期日</span>
                      <span />
                    </div>
                    <div className="mn-action-table">
                      {item.actions.map(ac => (
                        <div key={ac.id} className="mn-action-row">
                          <input className="mn-action-input" placeholder="やること" value={ac.what} onChange={e => updateAction(item.id, ac.id, 'what', e.target.value)} aria-label="アクション内容" />
                          <input className="mn-action-input" placeholder="誰が" value={ac.who} onChange={e => updateAction(item.id, ac.id, 'who', e.target.value)} aria-label="担当者" />
                          <input className="mn-action-input" placeholder="いつまで" value={ac.when} onChange={e => updateAction(item.id, ac.id, 'when', e.target.value)} aria-label="期日" />
                          <button className="mn-remove-btn" onClick={() => removeAction(item.id, ac.id)} disabled={item.actions.length === 1} aria-label="アクションを削除">✕</button>
                        </div>
                      ))}
                    </div>
                    <button className="mn-btn mn-btn-ghost mn-btn-sm" style={{ marginTop: 6 }} onClick={() => addAction(item.id)}>＋ アクション追加</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mn-panel">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div className="mn-panel-title" style={{ marginBottom: 0 }}>Markdown 出力</div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button className="mn-btn mn-btn-ghost mn-btn-sm" onClick={reset}>リセット</button>
                <button className="mn-btn mn-btn-ghost mn-btn-sm" onClick={copy}>コピー</button>
                <button className="mn-btn mn-btn-primary mn-btn-sm" onClick={download}>DL</button>
              </div>
            </div>
            <div className="mn-output-box" aria-label="Markdown出力">{md}</div>
          </div>
        </div>
      </div>

      {toast && <div className="mn-toast">{toast}</div>}
    </div>
  );
};

export default Minutes;
