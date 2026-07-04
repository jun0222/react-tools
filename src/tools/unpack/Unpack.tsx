import { useState } from 'react';
import { Split } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { buildPrompt } from './unpackCore';
import './Unpack.css';

const SK_WORD = 'unpack-word';

const load = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
};

const Unpack = () => {
  const { dark } = useTheme();
  const [word, setWord] = useState<string>(() => load(SK_WORD, ''));
  const [copied, setCopied] = useState(false);

  const prompt = buildPrompt(word);
  const isPlaceholder = !word.trim();

  const handleWordChange = (v: string) => {
    setWord(v);
    localStorage.setItem(SK_WORD, JSON.stringify(v));
  };

  const handleCopy = async () => {
    if (isPlaceholder) return;
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* ignore */ }
  };

  return (
    <div className={`up-root ${dark ? 'dark' : 'light'}`}>
      <div className="up-header">
        <div className="up-logo"><Split size={20} color="white" /></div>
        <h1><span className="up-accent">Unpack</span></h1>
        <button className="up-copy-btn" onClick={handleCopy} disabled={isPlaceholder}>
          {copied ? 'コピーしました！' : 'プロンプトをコピー'}
        </button>
      </div>

      <div className="up-body">
        <input
          className="up-input"
          placeholder="単語・概念を入力…"
          value={word}
          onChange={e => handleWordChange(e.target.value)}
          spellCheck={false}
          autoFocus
        />
        <div
          className="up-preview"
          role="region"
          aria-label="プロンプトプレビュー"
        >
          <pre className="up-prompt-text">{prompt}</pre>
        </div>
      </div>
    </div>
  );
};

export default Unpack;