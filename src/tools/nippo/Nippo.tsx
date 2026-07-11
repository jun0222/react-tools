import { useState } from 'react';
import { Newspaper } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import {
  parseEntries,
  buildSummary,
  fmtTimestamp,
  type Status,
} from './nippoCore';
import './Nippo.css';

const SK_TEXT = 'nippo-text';

const STATUS_LABEL: Record<Status, string> = {
  completed: '完了',
  'in-progress': '進行中',
  pending: '未着手',
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
  const nowEntries = entries.filter(e => e.now);

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
        {nowEntries.length > 0 && (
          <div className="np-now" role="region" aria-label="作業中">
            <div className="np-now-header">作業中</div>
            <div className="np-now-items">
              {nowEntries.map((e, i) => (
                <div key={i} className="np-now-item">・{e.label}</div>
              ))}
            </div>
          </div>
        )}

        <textarea
          className="np-input"
          role="textbox"
          value={text}
          onChange={e => handleTextChange(e.target.value)}
          placeholder={'・朝会 9:00~9:30 完了\n・設計 10:00~11:30 進行中\n・タスク名（時刻なし）'}
          spellCheck={false}
        />

        <div
          className="np-summary"
          role="region"
          aria-label="サマリ"
        >
          {(['pending', 'in-progress', 'completed'] as const).map(status => {
            const group = entries.filter(e => e.status === status);
            return (
              <div key={status} className={`np-group np-group--${status}`}>
                <div className="np-group-header">{STATUS_LABEL[status]}</div>
                <div className="np-group-items">
                  {group.length === 0
                    ? <div className="np-group-item np-group-item--empty">なし</div>
                    : group.map((e, i) => (
                        <div key={i} className="np-group-item">・{e.label}</div>
                      ))
                  }
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Nippo;