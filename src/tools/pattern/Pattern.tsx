import { useState } from 'react';
import { Layers } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { buildPrompt, type Lang } from './patternCore';
import './Pattern.css';

const SK_WORD = 'pattern-word';
const SK_LANG = 'pattern-lang';

const load = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
};

const Pattern = () => {
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
    <div className={`pt-root ${dark ? 'dark' : 'light'}`}>
      <div className="pt-header">
        <div className="pt-logo"><Layers size={20} color="white" /></div>
        <h1><span className="pt-accent">Pattern</span></h1>
        <div className="pt-lang-toggle">
          <button
            className={`pt-lang-btn ${lang === 'ja' ? 'pt-lang-btn--active' : ''}`}
            onClick={() => handleLangChange('ja')}
          >日本語</button>
          <button
            className={`pt-lang-btn ${lang === 'en' ? 'pt-lang-btn--active' : ''}`}
            onClick={() => handleLangChange('en')}
          >English</button>
        </div>
        <button className="pt-copy-btn" onClick={handleCopy} disabled={isPlaceholder}>
          {copied ? 'コピーしました！' : 'プロンプトをコピー'}
        </button>
      </div>

      <div className="pt-body">
        <input
          className="pt-input"
          placeholder="デザインパターン名を入力…（例: Singleton, Observer, Strategy）"
          value={word}
          onChange={e => handleWordChange(e.target.value)}
          spellCheck={false}
          autoFocus
        />
        <div
          className="pt-preview"
          role="region"
          aria-label="プロンプトプレビュー"
        >
          <pre className="pt-prompt-text">{prompt}</pre>
        </div>
      </div>
    </div>
  );
};

export default Pattern;