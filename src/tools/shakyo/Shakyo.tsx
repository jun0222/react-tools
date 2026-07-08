import { useState, type CSSProperties } from 'react';
import { BookOpen } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { buildPrompt } from './shakyoCore';
import '../_shared/PromptTool.css';
import './Shakyo.css';

const SK_TEXT = 'shakyo-text';

const load = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
};

const Shakyo = () => {
  const { dark } = useTheme();
  const [text, setText] = useState<string>(() => load(SK_TEXT, ''));
  const [copied, setCopied] = useState(false);

  const prompt = buildPrompt(text);
  const isPlaceholder = !text.trim();

  const handleTextChange = (v: string) => {
    setText(v);
    localStorage.setItem(SK_TEXT, JSON.stringify(v));
  };

  const handleCopy = async () => {
    if (isPlaceholder) return;
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* ignore */ }
  };

  const style = { '--ptool-accent': '#8b5cf6' } as CSSProperties;

  return (
    <div className={`ptool-root ${dark ? 'dark' : 'light'}`} style={style}>
      <div className="ptool-header">
        <div className="ptool-logo" style={{ background: 'linear-gradient(135deg, #8b5cf6, #6366f1)' }}>
          <BookOpen size={20} color="white" />
        </div>
        <h1><span className="ptool-accent">Shakyo</span></h1>
        <button className="ptool-copy-btn" onClick={handleCopy} disabled={isPlaceholder}>
          {copied ? 'コピーしました！' : 'プロンプトをコピー'}
        </button>
      </div>

      <div className="ptool-body">
        <textarea
          className="sk-textarea"
          placeholder="対象領域を入力…"
          value={text}
          onChange={e => handleTextChange(e.target.value)}
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

export default Shakyo;
