import { useState } from 'react';
import { Volume2 } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import './Echoboard.css';

const SK_TEXT = 'echoboard-text';

const load = (key: string, fallback: string): string => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
};

const Echoboard = () => {
  const { dark } = useTheme();
  const [text, setText] = useState<string>(() => load(SK_TEXT, ''));

  const handleChange = (v: string) => {
    setText(v);
    localStorage.setItem(SK_TEXT, JSON.stringify(v));
  };

  const handleClear = () => handleChange('');

  return (
    <div className={`eb-root ${dark ? 'dark' : 'light'}`}>
      <div className="eb-header">
        <div className="eb-logo"><Volume2 size={20} color="white" /></div>
        <h1><span className="eb-accent">Echoboard</span></h1>
        <button className="eb-clear-btn" onClick={handleClear} disabled={!text}>
          クリア
        </button>
      </div>

      <div className="eb-body">
        <textarea
          className="eb-input"
          value={text}
          onChange={e => handleChange(e.target.value)}
          placeholder="読み上げたいテキストを貼り付け…"
          spellCheck={false}
          autoFocus
        />

        <div className="eb-display" role="region" aria-label="読み上げ用テキスト">
          {/*
            text は JSX の子要素として展開しているだけで dangerouslySetInnerHTML は使わない。
            React はテキストノードとして描画しHTMLとして解釈しないため、この描画自体がXSS対策になる。
          */}
          {text
            ? <p className="eb-display-text">{text}</p>
            : <p className="eb-display-empty">ここにテキストが表示されます</p>
          }
        </div>
      </div>
    </div>
  );
};

export default Echoboard;