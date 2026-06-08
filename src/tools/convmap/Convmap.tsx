import { useState, useEffect, useCallback, useMemo } from 'react';
import { MessageSquare } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import './Convmap.css';

const SK_TEXT       = 'convmap-text';
const SK_PASSPHRASE = 'convmap-passphrase';

interface Message {
  role: 'user' | 'llm';
  text: string;
}

const parseMessages = (text: string, passphrase: string): Message[] => {
  if (!text.trim()) return [];
  const pp = passphrase.trim();
  const blocks = text.split(/\n{2,}/);
  const msgs: Message[] = [];
  for (const block of blocks) {
    const trimmed = block.trim();
    if (!trimmed) continue;
    if (pp && trimmed.startsWith(pp)) {
      msgs.push({ role: 'llm', text: trimmed.slice(pp.length).trimStart() });
    } else {
      if (msgs.length > 0 && msgs[msgs.length - 1].role === 'user') {
        msgs[msgs.length - 1] = { role: 'user', text: msgs[msgs.length - 1].text + '\n\n' + trimmed };
      } else {
        msgs.push({ role: 'user', text: trimmed });
      }
    }
  }
  return msgs;
};

const padZ = (n: number) => String(n).padStart(2, '0');

const genFilename = () => {
  const d = new Date();
  return `convmap-${d.getFullYear()}${padZ(d.getMonth()+1)}${padZ(d.getDate())}_${padZ(d.getHours())}${padZ(d.getMinutes())}${padZ(d.getSeconds())}.txt`;
};

const Convmap = () => {
  const { dark } = useTheme();
  const [text,       setText]       = useState(() => localStorage.getItem(SK_TEXT) ?? '');
  const [passphrase, setPassphrase] = useState(() => localStorage.getItem(SK_PASSPHRASE) ?? '');
  const [toast,      setToast]      = useState('');
  const [filename,   setFilename]   = useState(genFilename);

  useEffect(() => { localStorage.setItem(SK_TEXT,       text);       }, [text]);
  useEffect(() => { localStorage.setItem(SK_PASSPHRASE, passphrase); }, [passphrase]);

  const showToast = useCallback((msg: string) => {
    setToast(msg); setTimeout(() => setToast(''), 1800);
  }, []);

  const messages = useMemo(() => parseMessages(text, passphrase), [text, passphrase]);

  const refreshFilename = () => setFilename(genFilename());

  const saveCmd = `cat > ~/Desktop/${filename} << 'EOF'\n${text}\nEOF`;
  const pbcopyCmd = `cat ~/Desktop/${filename} | pbcopy`;

  const copyCmd = async (cmd: string, label: string) => {
    try { await navigator.clipboard.writeText(cmd); showToast(label); }
    catch { showToast('コピー失敗'); }
  };

  return (
    <div className={`convmap-root ${dark ? 'dark' : 'light'}`}>
      <div className="cm-header">
        <div className="cm-logo-icon"><MessageSquare size={20} color="white" /></div>
        <h1><span className="cm-accent">Convmap</span></h1>
      </div>

      {/* ===== PASSPHRASE CONFIG ===== */}
      <div className="cm-config-row">
        <span className="cm-config-label">LLM合言葉</span>
        <input
          className="cm-input cm-input-narrow"
          placeholder="例: 🤖 or [AI]"
          value={passphrase}
          onChange={e => setPassphrase(e.target.value)}
        />
        <span className="cm-config-hint">LLMのメッセージがこの文字列で始まるように指示してください</span>
      </div>

      {/* ===== TEXTAREA ===== */}
      <textarea
        className="cm-main-textarea"
        placeholder={`会話を貼り付けてください。\n\nユーザー発言は通常テキストで。\nLLM発言は合言葉で始めてください。\n\n例:\n今日の天気は？\n\n🤖\n東京は晴れです。`}
        value={text}
        onChange={e => setText(e.target.value)}
        rows={12}
      />

      {/* ===== BUBBLE VIEW ===== */}
      {messages.length > 0 && (
        <div className="cm-bubbles">
          {messages.map((msg, i) => (
            <div key={i} className={`cm-bubble cm-bubble-${msg.role}`}>
              <div className="cm-bubble-label">{msg.role === 'llm' ? 'LLM' : 'You'}</div>
              <div className="cm-bubble-text">{msg.text}</div>
            </div>
          ))}
        </div>
      )}

      {/* ===== FILE OUTPUT ===== */}
      {text.trim() && (
        <div className="cm-file-section">
          <div className="cm-file-header">
            <span className="cm-config-label">ファイル出力</span>
            <span className="cm-filename">{filename}</span>
            <button className="cm-btn cm-btn-ghost cm-btn-sm" onClick={refreshFilename}>更新</button>
          </div>
          <div className="cm-cmd-row">
            <code className="cm-cmd-text">{saveCmd}</code>
            <button className="cm-btn cm-btn-ghost cm-btn-sm" onClick={() => copyCmd(saveCmd, 'saveコマンドをコピーしました')}>コピー</button>
          </div>
          <div className="cm-cmd-row">
            <code className="cm-cmd-text">{pbcopyCmd}</code>
            <button className="cm-btn cm-btn-ghost cm-btn-sm" onClick={() => copyCmd(pbcopyCmd, 'pbcopyコマンドをコピーしました')}>コピー</button>
          </div>
        </div>
      )}

      {toast && <div className="cm-toast">{toast}</div>}
    </div>
  );
};

export default Convmap;
