import { useState, type CSSProperties } from 'react';
import { PenLine } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { buildPrompt, DEFAULT_N } from './blogenCore';
import '../_shared/PromptTool.css';
import './Blogen.css';

const SK_WORD = 'blogen-word';
const SK_N = 'blogen-n';

const load = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
};

const Blogen = () => {
  const { dark } = useTheme();
  const [word, setWord] = useState<string>(() => load(SK_WORD, ''));
  const [n, setN] = useState<number>(() => load(SK_N, DEFAULT_N));
  const [copied, setCopied] = useState(false);

  const prompt = buildPrompt(word, n);
  const isPlaceholder = !word.trim();

  const handleWordChange = (v: string) => {
    setWord(v);
    localStorage.setItem(SK_WORD, JSON.stringify(v));
  };

  const handleNChange = (v: number) => {
    setN(v);
    localStorage.setItem(SK_N, JSON.stringify(v));
  };

  const handleCopy = async () => {
    if (isPlaceholder) return;
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* ignore */ }
  };

  const style = { '--ptool-accent': '#eab308' } as CSSProperties;

  return (
    <div className={`ptool-root ${dark ? 'dark' : 'light'}`} style={style}>
      <div className="ptool-header">
        <div className="ptool-logo" style={{ background: 'linear-gradient(135deg, #eab308, #f97316)' }}>
          <PenLine size={20} color="white" />
        </div>
        <h1><span className="ptool-accent">Blogen</span></h1>
        <button className="ptool-copy-btn" onClick={handleCopy} disabled={isPlaceholder}>
          {copied ? 'コピーしました！' : 'プロンプトをコピー'}
        </button>
      </div>

      <div className="ptool-body">
        <div className="bg-controls">
          <textarea
            className="bg-textarea"
            placeholder="トピックを入力…"
            value={word}
            onChange={e => handleWordChange(e.target.value)}
            spellCheck={false}
            autoFocus
          />
          <label className="bg-n-label">
            文字数
            <input
              className="bg-n-input"
              type="number"
              min={1}
              value={n}
              onChange={e => handleNChange(Number(e.target.value))}
            />
          </label>
        </div>
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

export default Blogen;