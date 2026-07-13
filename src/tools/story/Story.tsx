import { useState, type CSSProperties } from 'react';
import { BookText } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { buildPrompt, TEMPLATES, type TemplateId } from './storyCore';
import '../_shared/PromptTool.css';
import './Story.css';

const SK_FRAGMENTS = 'story-fragments';
const SK_TEMPLATE = 'story-template';
const SK_LEARNING = 'story-learning';

const load = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
};

const Story = () => {
  const { dark } = useTheme();
  const [fragments, setFragments] = useState<string>(() => load(SK_FRAGMENTS, ''));
  const [templateId, setTemplateId] = useState<TemplateId>(() => load(SK_TEMPLATE, 'three-act'));
  const [learningMode, setLearningMode] = useState<boolean>(() => load(SK_LEARNING, false));
  const [copied, setCopied] = useState(false);

  const prompt = buildPrompt(fragments, templateId, learningMode);
  const isPlaceholder = !fragments.trim();

  const handleFragmentsChange = (v: string) => {
    setFragments(v);
    localStorage.setItem(SK_FRAGMENTS, JSON.stringify(v));
  };

  const handleTemplateChange = (v: TemplateId) => {
    setTemplateId(v);
    localStorage.setItem(SK_TEMPLATE, JSON.stringify(v));
  };

  const handleLearningToggle = () => {
    const next = !learningMode;
    setLearningMode(next);
    localStorage.setItem(SK_LEARNING, JSON.stringify(next));
  };

  const handleCopy = async () => {
    if (isPlaceholder) return;
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* ignore */ }
  };

  const style = { '--ptool-accent': '#f472b6' } as CSSProperties;

  return (
    <div className={`ptool-root ${dark ? 'dark' : 'light'}`} style={style}>
      <div className="ptool-header">
        <div className="ptool-logo" style={{ background: 'linear-gradient(135deg, #f472b6, #a855f7)' }}>
          <BookText size={20} color="white" />
        </div>
        <h1><span className="ptool-accent">Story</span></h1>
        <button className="ptool-copy-btn" onClick={handleCopy} disabled={isPlaceholder}>
          {copied ? 'コピーしました！' : 'プロンプトをコピー'}
        </button>
      </div>

      <div className="ptool-body">
        <div className="st-controls">
          <select
            className="st-select"
            value={templateId}
            onChange={e => handleTemplateChange(e.target.value as TemplateId)}
          >
            {TEMPLATES.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
          <label className="st-learning-label">
            <input
              type="checkbox"
              checked={learningMode}
              onChange={handleLearningToggle}
            />
            学習モード
          </label>
        </div>

        <textarea
          className="st-textarea"
          placeholder="設定の断片を自由に入力…（登場人物・出来事・キーワードなど）"
          value={fragments}
          onChange={e => handleFragmentsChange(e.target.value)}
          spellCheck={false}
          autoFocus
        />

        <div
          className="ptool-preview"
          role="region"
          aria-label="プロンプトプレビュー"
        >
          <pre className="ptool-prompt-text">{prompt}</pre>
        </div>
      </div>
    </div>
  );
};

export default Story;
