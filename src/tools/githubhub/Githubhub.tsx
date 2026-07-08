import { useState } from 'react';
import { GitPullRequest, HelpCircle, X } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { parseEntries, buildSummary, fmtTimestamp, type PrStatus } from './githubhubCore';
import './Githubhub.css';

const SK_TEXT = 'githubhub-text';

const COLUMNS: { status: PrStatus; label: string }[] = [
  { status: 'draft', label: 'Draft' },
  { status: 'open', label: 'Open' },
  { status: 'review', label: 'Review中' },
  { status: 'merged', label: 'Merged' },
];

const load = (key: string, fallback: string): string => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
};

const Githubhub = () => {
  const { dark } = useTheme();
  const [text, setText] = useState<string>(() => load(SK_TEXT, ''));
  const [copied, setCopied] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const entries = parseEntries(text);
  const findByNumber = (n: number) => entries.find(e => e.number === n);

  const handleTextChange = (v: string) => {
    setText(v);
    localStorage.setItem(SK_TEXT, JSON.stringify(v));
  };

  const handleCopy = async () => {
    if (entries.length === 0) return;
    const summary = buildSummary(entries, fmtTimestamp(new Date()));
    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* ignore */ }
  };

  return (
    <div className={`gh-root ${dark ? 'dark' : 'light'}`}>
      <div className="gh-header">
        <div className="gh-logo"><GitPullRequest size={20} color="white" /></div>
        <h1><span className="gh-accent">Githubhub</span></h1>
        <button className="gh-help-btn" onClick={() => setShowHelp(true)}>
          <HelpCircle size={16} />
          マニュアル
        </button>
        <button
          className="gh-copy-btn"
          onClick={handleCopy}
          disabled={entries.length === 0}
        >
          {copied ? 'コピーしました！' : 'サマリをコピー'}
        </button>
      </div>

      <div className="gh-body">
        <textarea
          className="gh-input"
          value={text}
          onChange={e => handleTextChange(e.target.value)}
          placeholder={'・https://github.com/org/repo/pull/123 open タイトル {依存:#120}'}
          spellCheck={false}
        />

        <div className="gh-board" role="region" aria-label="カンバンボード">
          {COLUMNS.map(col => {
            const items = entries.filter(e => e.status === col.status);
            return (
              <div key={col.status} className={`gh-column gh-column--${col.status}`}>
                <div className="gh-column-header" data-testid="gh-column-header">
                  {col.label}
                  <span className="gh-column-count">{items.length}</span>
                </div>
                <div className="gh-column-body">
                  {items.map(e => (
                    <div
                      key={e.number}
                      className={`gh-card gh-card--${e.status}`}
                      onClick={() => window.open(e.url, '_blank', 'noopener,noreferrer')}
                    >
                      <span className="gh-card-title">
                        #{e.number}{e.title ? ` ${e.title}` : ''}
                      </span>
                      {e.dependsOn !== null && (() => {
                        const dep = findByNumber(e.dependsOn);
                        return dep ? (
                          <a
                            className="gh-dep-badge"
                            href={dep.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={ev => ev.stopPropagation()}
                          >
                            → #{e.dependsOn}
                          </a>
                        ) : (
                          <span className="gh-dep-badge gh-dep-badge--plain">→ #{e.dependsOn}</span>
                        );
                      })()}
                    </div>
                  ))}
                  {items.length === 0 && <div className="gh-column-empty">なし</div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {showHelp && (
        <div
          className="gh-modal-backdrop"
          data-testid="gh-modal-backdrop"
          onClick={() => setShowHelp(false)}
        >
          <div
            className="gh-modal"
            role="dialog"
            aria-label="入力形式のマニュアル"
            onClick={e => e.stopPropagation()}
          >
            <div className="gh-modal-header">
              <h2>入力形式</h2>
              <button className="gh-modal-close" onClick={() => setShowHelp(false)}>
                <X size={18} />
                閉じる
              </button>
            </div>
            <div className="gh-modal-body">
              <p>1行につき1件、先頭に「・」を付けて入力します。</p>
              <pre className="gh-modal-code">
・URL [ステータス] [タイトル] [{'{'}依存:#番号{'}'}]
              </pre>
              <ul>
                <li><strong>URL</strong>: GitHubのPRリンク（必須）。末尾の番号を自動で抽出します</li>
                <li><strong>ステータス</strong>: draft / open / review / merged（省略時はdraft）</li>
                <li><strong>タイトル</strong>: 任意。付けるとカードに番号と一緒に表示されます</li>
                <li><strong>依存</strong>: <code>{'{'}依存:#120{'}'}</code> の形式で1件だけ指定可能。リスト内に該当PRがあればリンクになります</li>
              </ul>
              <p className="gh-modal-example-label">例:</p>
              <pre className="gh-modal-code">
・https://github.com/org/repo/pull/123 review ログイン修正 {'{'}依存:#120{'}'}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Githubhub;
