import { useState } from 'react';
import { Brain } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { buildPrompt, type Lang } from './grokCore';
import './Grok.css';

const SK_WORD = 'grok-word';
const SK_LANG = 'grok-lang';

const load = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
};

const Grok = () => {
  const { dark } = useTheme();
  const [word, setWord] = useState<string>(() => load(SK_WORD, ''));
  const [lang, setLang] = useState<Lang>(() => load(SK_LANG, 'ja'));
  const [copied, setCopied] = useState(false);

  const prompt = buildPrompt(word, lang);
  const isPlaceholder = !word.trim();

  const handleWordChange = (v: string) => {
    setWord(v);
    localStorage.setItem(SK_WORD, JSON.stringify(v));
  };

  const handleLangChange = (l: Lang) => {
    setLang(l);
    localStorage.setItem(SK_LANG, JSON.stringify(l));
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
    <div className={`gk-root ${dark ? 'dark' : 'light'}`}>
      <div className="gk-header">
        <div className="gk-logo"><Brain size={20} color="white" /></div>
        <h1><span className="gk-accent">Grok</span></h1>
        <div className="gk-lang-toggle">
          <button
            className={`gk-lang-btn ${lang === 'ja' ? 'gk-lang-btn--active' : ''}`}
            onClick={() => handleLangChange('ja')}
          >日本語</button>
          <button
            className={`gk-lang-btn ${lang === 'en' ? 'gk-lang-btn--active' : ''}`}
            onClick={() => handleLangChange('en')}
          >English</button>
        </div>
        <button className="gk-copy-btn" onClick={handleCopy} disabled={isPlaceholder}>
          {copied ? 'コピーしました！' : 'プロンプトをコピー'}
        </button>
      </div>

      <div className="gk-body">
        <input
          className="gk-input"
          placeholder="概念・単語を入力…"
          value={word}
          onChange={e => handleWordChange(e.target.value)}
          spellCheck={false}
          autoFocus
        />
        <div
          className="gk-preview"
          role="region"
          aria-label="プロンプトプレビュー"
        >
          <pre className="gk-prompt-text">{prompt}</pre>
        </div>
      </div>
    </div>
  );
};

export default Grok;