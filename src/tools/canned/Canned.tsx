import { useState, type CSSProperties } from 'react';
import { ClipboardList } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { TEMPLATES, findTemplate } from './cannedCore';
import '../_shared/PromptTool.css';
import './Canned.css';

const Canned = () => {
  const { dark } = useTheme();
  const [name, setName] = useState<string>(TEMPLATES[0].name);
  const [copied, setCopied] = useState(false);

  const text = findTemplate(name)?.text ?? '';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* ignore */ }
  };

  const style = { '--ptool-accent': '#0ea5e9' } as CSSProperties;

  return (
    <div className={`ptool-root ${dark ? 'dark' : 'light'}`} style={style}>
      <div className="ptool-header">
        <div className="ptool-logo" style={{ background: 'linear-gradient(135deg, #0ea5e9, #6366f1)' }}>
          <ClipboardList size={20} color="white" />
        </div>
        <h1><span className="ptool-accent">Canned</span></h1>
        <button className="ptool-copy-btn" onClick={handleCopy}>
          {copied ? 'コピーしました！' : 'プロンプトをコピー'}
        </button>
      </div>

      <div className="ptool-body">
        <select
          className="cn-select"
          value={name}
          onChange={e => setName(e.target.value)}
        >
          {TEMPLATES.map(t => (
            <option key={t.name} value={t.name}>{t.name}</option>
          ))}
        </select>
        <div
          className="ptool-preview"
          role="region"
          aria-label="プロンプトプレビュー"
        >
          <pre className="ptool-prompt-text">{text}</pre>
        </div>
      </div>
    </div>
  );
};

export default Canned;
