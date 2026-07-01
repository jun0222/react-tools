import { useState } from 'react';
import { Newspaper } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import {
  parseEntries,
  buildSummary,
  barPercent,
  GANTT_START_MIN,
  GANTT_RANGE_MIN,
  type Status,
} from './nippoCore';
import './Nippo.css';

const SK_TEXT = 'nippo-text';

const GANTT_HOURS = [6, 8, 10, 12, 14, 16, 18, 20, 22, 24];

const STATUS_LABEL: Record<Status, string> = {
  completed: '完了',
  'in-progress': '進行中',
  pending: '未着手',
};

const fmtTimestamp = (d: Date): string => {
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${mm}/${dd} ${hh}:${min}`;
};

const load = (key: string, fallback: string): string => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
};

const Nippo = () => {
  const { dark } = useTheme();
  const [text, setText] = useState<string>(() => load(SK_TEXT, ''));
  const [copied, setCopied] = useState(false);

  const entries = parseEntries(text);
  const timedEntries = entries.filter(e => e.startMin !== null);
  const noTimeEntries = entries.filter(e => e.startMin === null);

  const handleTextChange = (v: string) => {
    setText(v);
    localStorage.setItem(SK_TEXT, JSON.stringify(v));
  };

  const handleCopy = async () => {
    if (entries.length === 0) return;
    const summary = buildSummary(entries, fmtTimestamp(new Date()));
    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* ignore */ }
  };

  return (
    <div className={`np-root ${dark ? 'dark' : 'light'}`}>
      <div className="np-header">
        <div className="np-logo"><Newspaper size={20} color="white" /></div>
        <h1><span className="np-accent">Nippo</span></h1>
        <button
          className="np-copy-btn"
          onClick={handleCopy}
          disabled={entries.length === 0}
        >
          {copied ? 'コピーしました！' : 'サマリをコピー'}
        </button>
      </div>

      <div className="np-body">
        <textarea
          className="np-input"
          role="textbox"
          value={text}
          onChange={e => handleTextChange(e.target.value)}
          placeholder={'・朝会 9:00~9:30 完了\n・設計 10:00~11:30 進行中\n・タスク名（時刻なし）'}
          spellCheck={false}
        />

        <div
          className="np-gantt"
          role="region"
          aria-label="ガントチャート"
        >
          <div className="np-gantt-header">
            {GANTT_HOURS.map(h => (
              <span
                key={h}
                className="np-gantt-hour"
                style={{ left: `${((h * 60 - GANTT_START_MIN) / GANTT_RANGE_MIN) * 100}%` }}
              >
                {h}
              </span>
            ))}
          </div>
          <div className="np-gantt-rows">
            {timedEntries.map((e, i) => {
              const { left, width } = barPercent(e.startMin!, e.endMin!);
              return (
                <div key={i} className="np-gantt-row">
                  <div
                    className={`np-gantt-bar np-gantt-bar--${e.status}`}
                    style={{ left: `${left}%`, width: `${Math.max(width, 0.4)}%` }}
                    title={e.label}
                  >
                    <span className="np-gantt-bar-label">{e.label}</span>
                  </div>
                </div>
              );
            })}
            {noTimeEntries.map((e, i) => (
              <div key={`nt-${i}`} className="np-gantt-row">
                <div
                  className={`np-gantt-bar np-gantt-bar--${e.status} np-gantt-bar--no-time`}
                  style={{ left: '0%', width: '100%' }}
                  title={e.label}
                >
                  <span className="np-gantt-bar-label">{e.label}</span>
                </div>
              </div>
            ))}
            {entries.length === 0 && (
              <div className="np-gantt-empty">エントリを入力するとここに表示されます</div>
            )}
          </div>
        </div>

        <div
          className="np-summary"
          role="region"
          aria-label="サマリ"
        >
          {(['completed', 'in-progress', 'pending'] as const).map(status => {
            const group = entries.filter(e => e.status === status);
            if (group.length === 0) return null;
            return (
              <div key={status} className={`np-group np-group--${status}`}>
                <div className="np-group-header">{STATUS_LABEL[status]}</div>
                <div className="np-group-items">
                  {group.map((e, i) => (
                    <div key={i} className="np-group-item">・{e.label}</div>
                  ))}
                </div>
              </div>
            );
          })}
          {entries.length === 0 && (
            <div className="np-summary-empty">サマリがここに表示されます</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Nippo;