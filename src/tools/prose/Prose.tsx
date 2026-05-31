import { useState, useRef, useEffect } from 'react';
import { AlignLeft, Plus, X } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { CHECKLIST } from './proseData';
import './Prose.css';

type CustomRule = { id: string; label: string };

const SK_CUSTOM  = 'prose-custom-rules';
const SK_ENABLED = 'prose-enabled';
const SK_TEXT    = 'prose-text';

const allItemIds = CHECKLIST.flatMap(s => s.items.map(i => i.id));
const initialEnabled = Object.fromEntries(allItemIds.map(id => [id, true]));

const load = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
};

const loadCustomRules = (): CustomRule[] => load<CustomRule[]>(SK_CUSTOM, []);

const ALL_PRINCIPLES: string[] = CHECKLIST.flatMap(s => {
  if (!s.groupLabel) return s.items.map(i => `・${i.label}`);
  return [
    `・${s.groupLabel}`,
    ...s.items.map(i => `　- ${i.label}`),
  ];
});

const buildPrompt = (
  text: string,
  enabled: Record<string, boolean>,
  customRules: CustomRule[],
): string => {
  if (!text.trim()) return '（文書を貼り付けてください）';

  const checkedBuiltin = CHECKLIST
    .flatMap(s => s.items)
    .filter(i => enabled[i.id])
    .map(i => `・${i.reviewCriteria}`);

  const checkedCustom = customRules
    .filter(r => enabled[`c__${r.id}`])
    .map(r => `・${r.label}`);

  const checkedLines = [...checkedBuiltin, ...checkedCustom];
  if (checkedLines.length === 0) return '（観点を1つ以上チェックしてください）';

  const customPrincipleLines = customRules.map(r => `・${r.label}`);
  const allPrincipleLines = [...ALL_PRINCIPLES, ...customPrincipleLines].join('\n');

  return `以下の文書をレビューしてください。

【この文書が従っている指針】
${allPrincipleLines}

【今回のレビュー観点】
${checkedLines.join('\n')}

【出力形式】
指摘ごとに以下の形式で出力してください。指摘は重要度の高い順に並べてください。

---
【観点】〇〇
【該当箇所】「...（原文を引用）...」
【問題点】...
【改善案】...
---

【レビュー対象の文書】
${text}`;
};

const Prose = () => {
  const { dark } = useTheme();
  const [text, setText] = useState<string>(() => load<string>(SK_TEXT, ''));
  const [customRules, setCustomRules] = useState<CustomRule[]>(loadCustomRules);
  const [enabled, setEnabled] = useState<Record<string, boolean>>(() => {
    const saved = loadCustomRules();
    const customEnabled = Object.fromEntries(saved.map(r => [`c__${r.id}`, true]));
    const savedEnabled = load<Record<string, boolean>>(SK_ENABLED, {});
    return { ...initialEnabled, ...customEnabled, ...savedEnabled };
  });
  const [customInput, setCustomInput] = useState('');
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { localStorage.setItem(SK_CUSTOM,  JSON.stringify(customRules)); }, [customRules]);
  useEffect(() => { localStorage.setItem(SK_ENABLED, JSON.stringify(enabled));     }, [enabled]);
  useEffect(() => { localStorage.setItem(SK_TEXT,    text);                        }, [text]);

  const toggle = (id: string) =>
    setEnabled(prev => ({ ...prev, [id]: !prev[id] }));

  const setGroup = (sectionId: string, value: boolean) => {
    const section = CHECKLIST.find(s => s.id === sectionId);
    if (!section) return;
    setEnabled(prev => {
      const next = { ...prev };
      section.items.forEach(i => { next[i.id] = value; });
      return next;
    });
  };

  const addCustomRule = () => {
    const label = customInput.trim();
    if (!label) return;
    const id = `${Date.now()}`;
    setCustomRules(prev => [...prev, { id, label }]);
    setEnabled(prev => ({ ...prev, [`c__${id}`]: true }));
    setCustomInput('');
    inputRef.current?.focus();
  };

  const removeCustomRule = (id: string) => {
    setCustomRules(prev => prev.filter(r => r.id !== id));
    setEnabled(prev => {
      const next = { ...prev };
      delete next[`c__${id}`];
      return next;
    });
  };

  const prompt = buildPrompt(text, enabled, customRules);
  const isPlaceholder =
    prompt === '（文書を貼り付けてください）' ||
    prompt === '（観点を1つ以上チェックしてください）';

  const handleCopy = async () => {
    if (isPlaceholder) return;
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* ignore */ }
  };

  return (
    <div className={`pr-root ${dark ? 'dark' : 'light'}`}>
      <div className="pr-header">
        <div className="pr-logo-icon"><AlignLeft size={20} color="white" /></div>
        <h1><span className="pr-accent">Prose</span></h1>
        <button className="pr-copy-btn" onClick={handleCopy} disabled={isPlaceholder}>
          {copied ? 'コピーしました！' : 'プロンプトをコピー'}
        </button>
      </div>

      <div className="pr-body">
        <textarea
          className="pr-input"
          placeholder="文書を貼り付けてください"
          value={text}
          onChange={e => setText(e.target.value)}
          rows={10}
          aria-label="元の文書"
          spellCheck={false}
        />

        <div className="pr-checklist">
          {CHECKLIST.map(section => {
            if (!section.groupLabel) {
              return section.items.map(item => (
                <label key={item.id} className="pr-check-row">
                  <input
                    type="checkbox"
                    className="pr-checkbox"
                    checked={!!enabled[item.id]}
                    onChange={() => toggle(item.id)}
                  />
                  <span className="pr-check-label">{item.label}</span>
                </label>
              ));
            }

            const allOn = section.items.every(i => enabled[i.id]);
            const someOn = section.items.some(i => enabled[i.id]);
            return (
              <div key={section.id} className="pr-group-section">
                <label className="pr-check-row pr-group-row">
                  <input
                    type="checkbox"
                    className="pr-checkbox"
                    checked={allOn}
                    ref={el => { if (el) el.indeterminate = !allOn && someOn; }}
                    onChange={() => setGroup(section.id, !allOn)}
                  />
                  <span className="pr-group-label">{section.groupLabel}</span>
                </label>
                <div className="pr-group-children">
                  {section.items.map(item => (
                    <label key={item.id} className="pr-check-row pr-check-row--child">
                      <input
                        type="checkbox"
                        className="pr-checkbox"
                        checked={!!enabled[item.id]}
                        onChange={() => toggle(item.id)}
                      />
                      <span className="pr-check-label">{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            );
          })}

          <div className="pr-custom-section">
            <div className="pr-custom-header">
              <span className="pr-group-label">カスタム観点</span>
              <div className="pr-custom-input-row">
                <input
                  ref={inputRef}
                  className="pr-custom-input"
                  value={customInput}
                  onChange={e => setCustomInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') addCustomRule(); }}
                  placeholder="観点を入力して追加"
                  aria-label="カスタム観点を入力"
                />
                <button
                  className="pr-custom-add"
                  onClick={addCustomRule}
                  disabled={!customInput.trim()}
                  aria-label="追加"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>
            {customRules.map(rule => (
              <label key={rule.id} className="pr-check-row pr-check-row--child pr-custom-row">
                <input
                  type="checkbox"
                  className="pr-checkbox"
                  checked={!!enabled[`c__${rule.id}`]}
                  onChange={() => toggle(`c__${rule.id}`)}
                />
                <span className="pr-check-label">{rule.label}</span>
                <button
                  className="pr-custom-remove"
                  onClick={e => { e.preventDefault(); removeCustomRule(rule.id); }}
                  aria-label="削除"
                >
                  <X size={12} />
                </button>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Prose;
