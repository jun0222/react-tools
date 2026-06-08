import { useState, useEffect } from 'react';
import { Lightbulb } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { INSIGHT_SECTIONS } from './insightData';
import './Insight.css';

const SK_TOPIC   = 'insight-topic';
const SK_ENABLED = 'insight-enabled';
const SK_GENERAL = 'insight-general';

const allIds = INSIGHT_SECTIONS.flatMap(s => s.items.map(i => i.id));
const initialEnabled = Object.fromEntries(allIds.map(id => [id, true]));

const load = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
};

const CITATION_LINE = '・各洞察に、できるだけ信頼できる出典（学術論文・書籍・一次資料など）を示してください';

const selectedItems = (enabled: Record<string, boolean>) =>
  INSIGHT_SECTIONS.flatMap(s => s.items).filter(i => enabled[i.id]);

const buildPrompt = (
  topic: string,
  enabled: Record<string, boolean>,
  generalMode: boolean,
): string => {
  if (!topic.trim()) return '（テーマを入力してください）';

  const selected = selectedItems(enabled);
  if (selected.length === 0) return '（観点を1つ以上選択してください）';

  const lines = selected.map(i => `・${i.label}：${i.instruction}`).join('\n');
  const generalLine = generalMode
    ? '\n【モード】一般論として論じてください。特定のケースに限定せず、広く適用できる原理・法則・理論として洞察を示してください。\n'
    : '';

  return `以下のテーマについて、深い洞察を提供してください。
表面的・一般的な分析は不要です。本質を突く、驚きや発見のある洞察を求めます。
${generalLine}
【テーマ】
${topic.trim()}

【洞察の観点】
${lines}

【方針】
・各観点について、具体的かつ本質的な洞察を記述してください
・常識的・教科書的な指摘は避け、反直感的・多層的な視点を優先してください
・観点同士をつなげて、より深い洞察が生まれる場合はそれも示してください
${CITATION_LINE}`;
};

const buildFollowupPrompt = (enabled: Record<string, boolean>): string => {
  const selected = selectedItems(enabled);
  if (selected.length === 0) return '';
  const lines = selected.map(i => `・${i.label}：${i.instruction}`).join('\n');
  return `今の出力について、以下の観点でさらに深掘りしてください。

【深掘りの観点】
${lines}

${CITATION_LINE}`;
};

const Insight = () => {
  const { dark } = useTheme();
  const [topic,       setTopic]       = useState<string>(() => load(SK_TOPIC, ''));
  const [enabled,     setEnabled]     = useState<Record<string, boolean>>(() => ({
    ...initialEnabled,
    ...load<Record<string, boolean>>(SK_ENABLED, {}),
  }));
  const [generalMode, setGeneralMode] = useState<boolean>(() => load(SK_GENERAL, false));
  const [copied,         setCopied]         = useState(false);
  const [copiedFollowup, setCopiedFollowup] = useState(false);

  useEffect(() => { localStorage.setItem(SK_TOPIC,   JSON.stringify(topic));       }, [topic]);
  useEffect(() => { localStorage.setItem(SK_ENABLED, JSON.stringify(enabled));     }, [enabled]);
  useEffect(() => { localStorage.setItem(SK_GENERAL, JSON.stringify(generalMode)); }, [generalMode]);

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

  const prompt = buildPrompt(topic, enabled, generalMode);
  const isPlaceholder =
    prompt === '（テーマを入力してください）' ||
    prompt === '（観点を1つ以上選択してください）';
  const hasSelected = selectedItems(enabled).length > 0;

  const handleCopy = async () => {
    if (isPlaceholder) return;
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* ignore */ }
  };

  const handleFollowup = async () => {
    if (!hasSelected) return;
    try {
      await navigator.clipboard.writeText(buildFollowupPrompt(enabled));
      setCopiedFollowup(true);
      setTimeout(() => setCopiedFollowup(false), 1500);
    } catch { /* ignore */ }
  };

  return (
    <div className={`ins-root ${dark ? 'dark' : 'light'}`}>
      <div className="ins-header">
        <div className="ins-logo"><Lightbulb size={20} color="white" /></div>
        <h1><span className="ins-accent">Insight</span></h1>
        <button className="ins-copy-btn ins-copy-btn--followup" onClick={handleFollowup} disabled={!hasSelected}>
          {copiedFollowup ? 'コピーしました！' : '今の出力について'}
        </button>
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

        <label className="ins-general-toggle">
          <input
            type="checkbox"
            className="ins-checkbox"
            checked={generalMode}
            onChange={() => setGeneralMode(v => !v)}
          />
          <span className="ins-general-label">一般論モード</span>
          <span className="ins-general-desc">特定ケースに限らず広く適用できる原理・法則として洞察を求める</span>
        </label>

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
