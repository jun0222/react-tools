import { useState, useCallback } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { convertRomaji } from './romajiCore';
import './Romaji.css';

let _id = 0;
const uid = () => `skip-${++_id}`;

const Romaji = () => {
  const { dark } = useTheme();
  const [input, setInput] = useState('');
  const [longVowel, setLongVowel] = useState(false);
  const [skipWords, setSkipWords] = useState<{ id: string; value: string }[]>([
    { id: uid(), value: '' },
  ]);
  const [toast, setToast] = useState('');

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 1800);
  }, []);

  const output = input.trim()
    ? convertRomaji(input, skipWords.map(s => s.value), longVowel)
    : '';

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(output);
      showToast('コピーしました');
    } catch {
      showToast('コピー失敗');
    }
  };

  const updateWord = (id: string, value: string) =>
    setSkipWords(prev => prev.map(s => s.id === id ? { ...s, value } : s));

  const removeWord = (id: string) =>
    setSkipWords(prev => prev.filter(s => s.id !== id));

  const addWord = () =>
    setSkipWords(prev => [...prev, { id: uid(), value: '' }]);

  return (
    <div className={`rj-root ${dark ? 'dark' : 'light'}`}>
      <header className="rj-header">
        <div className="rj-logo-icon">あ</div>
        <h1>ローマ字 <span className="accent">→ ひらがな</span></h1>
      </header>

      <div className="rj-body">
        <div className="rj-pane">
          <label className="rj-label">ローマ字</label>
          <textarea
            className="rj-textarea"
            placeholder={'watashi ha gakusei desu\nkitto umaku iku yo\n\n{} で囲った部分は変換されません（例: {Tokyo} ni sumu）'}
            value={input}
            onChange={e => setInput(e.target.value)}
            rows={7}
            spellCheck={false}
            aria-label="ローマ字入力"
          />
        </div>

        <div className="rj-pane">
          <div className="rj-output-header">
            <label className="rj-label">ひらがな</label>
            <button
              className={`rj-toggle ${longVowel ? 'rj-toggle--on' : ''}`}
              onClick={() => setLongVowel(v => !v)}
              aria-pressed={longVowel}
              title="連続する同じ母音を長音符（ー）に変換"
            >
              ー 長音符
            </button>
          </div>
          <div
            className={`rj-output${!output ? ' rj-output--empty' : ''}`}
            aria-label="ひらがな変換結果"
          >
            {output || '変換結果がここに表示されます'}
          </div>
          {output && (
            <button className="rj-btn rj-btn-accent" onClick={copy}>
              コピー
            </button>
          )}
        </div>
      </div>

      <div className="rj-skip-section">
        <div className="rj-skip-header">
          <span className="rj-label">変換しない文字列</span>
          <span className="rj-skip-hint">
            {'{ } で囲っても除外できます（例: {Tokyo}）'}
          </span>
        </div>
        <div className="rj-skip-list">
          {skipWords.map((s, i) => (
            <div key={s.id} className="rj-skip-row">
              <input
                className="rj-skip-input"
                type="text"
                placeholder={`除外する文字列 ${i + 1}`}
                value={s.value}
                onChange={e => updateWord(s.id, e.target.value)}
                aria-label={`除外文字列 ${i + 1}`}
              />
              <button
                className="rj-btn rj-btn-ghost rj-btn-remove"
                onClick={() => removeWord(s.id)}
                disabled={skipWords.length === 1}
                aria-label="除外文字列を削除"
              >
                ✕
              </button>
            </div>
          ))}
          <button className="rj-btn rj-btn-ghost" onClick={addWord}>
            ＋ 追加
          </button>
        </div>
      </div>

      {toast && <div className="rj-toast">{toast}</div>}
    </div>
  );
};

export default Romaji;