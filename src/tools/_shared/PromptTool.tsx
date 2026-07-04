import { useState, type ReactNode, type CSSProperties } from 'react';
import { useTheme } from '../../context/ThemeContext';
import './PromptTool.css';

interface PromptToolProps {
  name: string;
  icon: ReactNode;
  iconBg: string;
  accent: string;
  storageKey: string;
  placeholder: string;
  buildPrompt: (word: string) => string;
  requireWord?: boolean;
}

const load = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
};

const PromptTool = ({ name, icon, iconBg, accent, storageKey, placeholder, buildPrompt, requireWord = true }: PromptToolProps) => {
  const { dark } = useTheme();
  const [word, setWord] = useState<string>(() => load(storageKey, ''));
  const [copied, setCopied] = useState(false);

  const prompt = buildPrompt(word);
  const isPlaceholder = requireWord && !word.trim();

  const handleWordChange = (v: string) => {
    setWord(v);
    localStorage.setItem(storageKey, JSON.stringify(v));
  };

  const handleCopy = async () => {
    if (isPlaceholder) return;
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* ignore */ }
  };

  const style = { '--ptool-accent': accent } as CSSProperties;

  return (
    <div className={`ptool-root ${dark ? 'dark' : 'light'}`} style={style}>
      <div className="ptool-header">
        <div className="ptool-logo" style={{ background: iconBg }}>{icon}</div>
        <h1><span className="ptool-accent">{name}</span></h1>
        <button className="ptool-copy-btn" onClick={handleCopy} disabled={isPlaceholder}>
          {copied ? 'コピーしました！' : 'プロンプトをコピー'}
        </button>
      </div>

      <div className="ptool-body">
        <input
          className="ptool-input"
          placeholder={placeholder}
          value={word}
          onChange={e => handleWordChange(e.target.value)}
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

export default PromptTool;
