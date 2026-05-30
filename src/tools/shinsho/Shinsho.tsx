import { useState } from 'react';
import { BookOpen } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { GENRES } from './shinshoData';
import './Shinsho.css';

const initialEnabled = Object.fromEntries(
  GENRES.flatMap(g => g.labels.map(l => [l.id, l.star === true]))
);

const buildPrompt = (query: string, enabled: Record<string, boolean>): string => {
  const selected = GENRES.flatMap(g => g.labels).filter(l => enabled[l.id]);
  if (!query.trim()) return '（質問を入力してください）';
  if (selected.length === 0) return '（レーベルを1つ以上選択してください）';
  const labelLines = selected.map(l => `・${l.name}（${l.publisher}）`).join('\n');
  return `以下の信頼できる書籍レーベルの中から、「${query}」に関するおすすめの本を3〜5冊教えてください。

【対象レーベル】
${labelLines}

各書籍について以下を教えてください：
・タイトル
・著者名
・レーベル名
・推薦理由（具体的に2〜3文で）`;
};

const Shinsho = () => {
  const { dark } = useTheme();
  const [query, setQuery] = useState('');
  const [enabled, setEnabled] = useState<Record<string, boolean>>(initialEnabled);
  const [copied, setCopied] = useState(false);

  const toggleLabel = (id: string) =>
    setEnabled(prev => ({ ...prev, [id]: !prev[id] }));

  const toggleGenre = (genreId: string, value: boolean) => {
    const genre = GENRES.find(g => g.id === genreId);
    if (!genre) return;
    setEnabled(prev => {
      const next = { ...prev };
      genre.labels.forEach(l => { next[l.id] = value; });
      return next;
    });
  };

  const handleCopy = async () => {
    const prompt = buildPrompt(query, enabled);
    if (prompt === '（質問を入力してください）' || prompt === '（レーベルを1つ以上選択してください）') return;
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* ignore */ }
  };

  const prompt = buildPrompt(query, enabled);
  const isPlaceholder = prompt === '（質問を入力してください）' || prompt === '（レーベルを1つ以上選択してください）';

  return (
    <div className={`sh-root ${dark ? 'dark' : 'light'}`}>
      <div className="sh-header">
        <div className="sh-logo-icon"><BookOpen size={22} color="white" /></div>
        <h1><span className="sh-accent">Shinsho</span></h1>
        <button
          className="sh-copy-btn"
          onClick={handleCopy}
          disabled={isPlaceholder}
        >
          {copied ? 'コピーしました！' : 'プロンプトをコピー'}
        </button>
      </div>

      <div className="sh-body">
        <textarea
          className="sh-query"
          placeholder="例：認知バイアスについて知りたい"
          value={query}
          onChange={e => setQuery(e.target.value)}
          rows={3}
          aria-label="質問を入力"
        />

        <div className="sh-genres">
          {GENRES.map(genre => {
            const allOn = genre.labels.every(l => enabled[l.id]);
            const allOff = genre.labels.every(l => !enabled[l.id]);
            return (
              <div key={genre.id} className="sh-genre">
                <div className="sh-genre-header">
                  <span className="sh-genre-name">{genre.name}</span>
                  <button
                    className="sh-genre-toggle"
                    onClick={() => toggleGenre(genre.id, allOn ? false : true)}
                  >
                    {allOff ? '全ON' : allOn ? '全OFF' : '全OFF'}
                  </button>
                </div>
                <div className="sh-labels">
                  {genre.labels.map(label => (
                    <button
                      key={label.id}
                      className={`sh-label-pill ${enabled[label.id] ? 'sh-label-pill--on' : 'sh-label-pill--off'}`}
                      onClick={() => toggleLabel(label.id)}
                    >
                      {label.star && <span className="sh-star">★</span>}
                      {label.name}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Shinsho;
