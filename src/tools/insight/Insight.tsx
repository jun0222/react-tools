import { useState, useEffect } from 'react';
import { Lightbulb } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { INSIGHT_SECTIONS } from './insightData';
import './Insight.css';

const SK_TOPIC   = 'insight-topic';
const SK_ENABLED = 'insight-enabled';

const allIds = INSIGHT_SECTIONS.flatMap(s => s.items.map(i => i.id));
const initialEnabled = Object.fromEntries(allIds.map(id => [id, true]));

const load = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
};

const buildPrompt = (topic: string, enabled: Record<string, boolean>): string => {
  if (!topic.trim()) return '（テーマを入力してください）';

  const selected = INSIGHT_SECTIONS
    .flatMap(s => s.items)
    .filter(i => enabled[i.id]);

  if (selected.length === 0) return '（観点を1つ以上選択してください）';

  const lines = selected.map(i => `・${i.label}：${i.instruction}`).join('\n');

  return `以下のテーマについて、深い洞察を提供してください。
表面的・一般的な分析は不要です。本質を突く、驚きや発見のある洞察を求めます。

【テーマ】
${topic.trim()}

【洞察の観点】
${lines}

【方針】
・各観点について、具体的かつ本質的な洞察を記述してください
・常識的・教科書的な指摘は避け、反直感的・多層的な視点を優先してください
・観点同士をつなげて、より深い洞察が生まれる場合はそれも示してください`;
};

const Insight = () => {
  const { dark } = useTheme();
  const [topic,   setTopic]   = useState<string>(() => load(SK_TOPIC, ''));
  const [enabled, setEnabled] = useState<Record<string, boolean>>(() => ({
    ...initialEnabled,
    ...load<Record<string, boolean>>(SK_ENABLED, {}),
  }));
  const [copied, setCopied] = useState(false);

  useEffect(() => { localStorage.setItem(SK_TOPIC,   JSON.stringify(topic));   }, [topic]);
  useEffect(() => { localStorage.setItem(SK_ENABLED, JSON.stringify(enabled)); }, [enabled]);

  const toggle = (id: string) =>
    setEnabled(prev => ({ ...prev, [id]: !prev[id] }));

  const setGroup = (sectionId: string, value: boolean) => {
    const section = INSIGHT_SECTIONS.find(s => s.id === sectionId);
    if (!section) return;
    setEnabled(prev => {
      const next = { ...prev };
      section.items.forEach(i => { next[i.id] = value; });
      return next;
    });
  };

  const prompt = buildPrompt(topic, enabled);
  const isPlaceholder =
    prompt === '（テーマを入力してください）' ||
    prompt === '（観点を1つ以上選択してください）';

  const handleCopy = async () => {
    if (isPlaceholder) return;
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* ignore */ }
  };

  return (
    <div className={`ins-root ${dark ? 'dark' : 'light'}`}>
      <div className="ins-header">
        <div className="ins-logo"><Lightbulb size={20} color="white" /></div>
        <h1><span className="ins-accent">Insight</span></h1>
        <button className="ins-copy-btn" onClick={handleCopy} disabled={isPlaceholder}>
          {copied ? 'コピーしました！' : 'プロンプトをコピー'}
        </button>
      </div>

      <div className="ins-body">
        <textarea
          className="ins-input"
          placeholder="洞察を深めたいテーマや問いを入力してください"
          value={topic}
          onChange={e => setTopic(e.target.value)}
          rows={4}
          spellCheck={false}
        />

        <div className="ins-checklist">
          {INSIGHT_SECTIONS.map(section => {
            if (!section.groupLabel) {
              return section.items.map(item => (
                <label key={item.id} className="ins-check-row" title={item.instruction}>
                  <input
                    type="checkbox"
                    className="ins-checkbox"
                    checked={!!enabled[item.id]}
                    onChange={() => toggle(item.id)}
                  />
                  <span className="ins-check-label">{item.label}</span>
                </label>
              ));
            }

            const allOn  = section.items.every(i => enabled[i.id]);
            const someOn = section.items.some(i => enabled[i.id]);
            return (
              <div key={section.id} className="ins-group-section">
                <label className="ins-check-row ins-group-row">
                  <input
                    type="checkbox"
                    className="ins-checkbox"
                    checked={allOn}
                    ref={el => { if (el) el.indeterminate = !allOn && someOn; }}
                    onChange={() => setGroup(section.id, !allOn)}
                  />
                  <span className="ins-group-label">{section.groupLabel}</span>
                </label>
                <div className="ins-group-children">
                  {section.items.map(item => (
                    <label key={item.id} className="ins-check-row ins-check-row--child" title={item.instruction}>
                      <input
                        type="checkbox"
                        className="ins-checkbox"
                        checked={!!enabled[item.id]}
                        onChange={() => toggle(item.id)}
                      />
                      <span className="ins-check-label">{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Insight;
