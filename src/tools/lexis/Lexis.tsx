import { useState } from 'react';
import { GraduationCap } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import './Lexis.css';

const SK_WORD = 'lexis-word';
const SK_LANG = 'lexis-lang';

type Lang = 'ja' | 'en';

const load = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
};

const buildPrompt = (word: string, lang: Lang): string => {
  const w = word.trim();
  if (!w) return '（単語を入力してください）';

  if (lang === 'ja') {
    return `「${w}」について、以下の5点を日本語で教えてください。

【定義】
「${w}」の正確な定義を1〜2文で述べてください。

【なぜ？】
なぜこの概念・語が必要とされるのか、どんな問題や文脈から生まれたのかを説明してください。

【語源】
「${w}」の語源（由来）を説明してください。どの言語・語根から来ているか、もとの意味は何かを含めてください。

【歴史的経緯】
「${w}」がどのように生まれ、時代を経てどのように発展・変化してきたかを説明してください。重要な人物・出来事・転換点があれば含めてください。

【例文 × 10】
「${w}」が実際に使われる、短い1行の例文を10個挙げてください。番号付きリストで。

各項目を明確に区切り、簡潔にまとめてください。`;
  }

  return `Please explain the following word or concept: "${w}"

[Definition]
Give a precise definition of "${w}" in 1-2 sentences.

[Why?]
Explain why this concept/word exists — what problem or need gave rise to it, and in what context it emerged.

[Etymology]
Explain the etymology of "${w}" — which language or root it comes from and what the original meaning was.

[Historical Background]
Describe how "${w}" came about and how it developed or evolved over time. Include key figures, events, or turning points if relevant.

[10 Example Sentences]
Give 10 short, one-line sentences that use "${w}" in context. Use a numbered list.

Keep each section concise and clear.`;
};

const Lexis = () => {
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
    <div className={`lx-root ${dark ? 'dark' : 'light'}`}>
      <div className="lx-header">
        <div className="lx-logo"><GraduationCap size={20} color="white" /></div>
        <h1><span className="lx-accent">Lexis</span></h1>
        <div className="lx-lang-toggle">
          <button
            className={`lx-lang-btn ${lang === 'ja' ? 'lx-lang-btn--active' : ''}`}
            onClick={() => handleLangChange('ja')}
          >日本語</button>
          <button
            className={`lx-lang-btn ${lang === 'en' ? 'lx-lang-btn--active' : ''}`}
            onClick={() => handleLangChange('en')}
          >English</button>
        </div>
        <button className="lx-copy-btn" onClick={handleCopy} disabled={isPlaceholder}>
          {copied ? 'コピーしました！' : 'プロンプトをコピー'}
        </button>
      </div>

      <div className="lx-body">
        <input
          className="lx-input"
          placeholder="単語・概念を入力..."
          value={word}
          onChange={e => handleWordChange(e.target.value)}
          spellCheck={false}
          autoFocus
        />

        <div
          className="lx-preview"
          role="region"
          aria-label="プロンプトプレビュー"
        >
          <pre className="lx-prompt-text">{prompt}</pre>
        </div>
      </div>
    </div>
  );
};

export default Lexis;