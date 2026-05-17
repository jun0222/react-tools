import { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import './Pad.css';

const STORAGE_KEY = 'pad-text';

const Pad = () => {
  const { dark } = useTheme();
  const [text, setText] = useState(() => {
    try { return localStorage.getItem(STORAGE_KEY) ?? ''; } catch { return ''; }
  });

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, text); } catch { /* ignore */ }
  }, [text]);

  return (
    <div className={`pad-tool ${dark ? 'dark' : 'light'}`}>
      <textarea
        className="pad-textarea"
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="自由に書いてください"
        spellCheck={false}
        aria-label="テキストパッド"
      />
    </div>
  );
};

export default Pad;
