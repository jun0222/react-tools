import { useState, useEffect, useCallback } from 'react';
import { useTheme } from '../../context/ThemeContext';
import {
  type DiaryMode,
  type FileMeta,
  MODE_CONFIG,
  toBullets,
  formatBullets,
  generateLLMPrompt,
  parseLLMResponse,
  generateTxtContent,
  getDateLabel,
  generateFilename,
} from './diaryCore';
import './Diary.css';

const MODES = Object.keys(MODE_CONFIG) as DiaryMode[];
const STORAGE_KEY = 'diary-state-v4';

type ModeState = {
  text: string;
  llmResponse: string;
  bookTitle: string;
  startPage: string;
  endPage: string;
  subject: string;
};
type AllState = Record<DiaryMode, ModeState>;

const EMPTY_MODE: ModeState = { text: '', llmResponse: '', bookTitle: '', startPage: '', endPage: '', subject: '' };

const DEFAULT_STATE: AllState = {
  diary:     { ...EMPTY_MODE },
  book_memo: { ...EMPTY_MODE },
  research:  { ...EMPTY_MODE },
  nippo:     { ...EMPTY_MODE },
  study:     { ...EMPTY_MODE },
};

const loadState = (): AllState => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<AllState>;
      return {
        ...DEFAULT_STATE,
        ...Object.fromEntries(
          MODES.map(m => [m, { ...EMPTY_MODE, ...(parsed[m] ?? {}) }])
        ),
      } as AllState;
    }
  } catch { /* ignore */ }
  return { ...DEFAULT_STATE };
};

const Diary = () => {
  const { dark } = useTheme();
  const [mode, setMode] = useState<DiaryMode>('diary');
  const [allState, setAllState] = useState<AllState>(loadState);
  const [toast, setToast] = useState('');

  const ms = allState[mode];
  const text        = ms.text;
  const llmResponse = ms.llmResponse;

  const setField = <K extends keyof ModeState>(key: K, val: ModeState[K]) =>
    setAllState(prev => ({ ...prev, [mode]: { ...prev[mode], [key]: val } }));

  const dateLabel = getDateLabel();
  const bullets = toBullets(text);
  const bulletsText = formatBullets(bullets);
  const { summary, keywords } = parseLLMResponse(llmResponse);

  const fileMeta: FileMeta = {
    bookTitle: ms.bookTitle,
    startPage: ms.startPage,
    endPage:   ms.endPage,
    subject:   ms.subject,
  };
  const filename = generateFilename(mode, fileMeta);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(allState)); } catch { /* ignore */ }
  }, [allState]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 1800);
  }, []);

  const copyPrompt = async () => {
    if (!bullets.length) return;
    try {
      await navigator.clipboard.writeText(generateLLMPrompt(bullets));
      showToast('プロンプトをコピーしました');
    } catch {
      showToast('コピー失敗');
    }
  };

  const exportTxt = () => {
    const content = generateTxtContent(dateLabel, bullets, summary, keywords, mode);
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    showToast('.txtを保存しました');
  };

  return (
    <div className={`diary-tool ${dark ? 'dark' : 'light'}`}>
      <div className="dy-header">
        <div className="dy-logo-icon">📔</div>
        <div>
          <h1><span className="accent">Diary</span></h1>
          <div className="dy-date">{dateLabel}</div>
        </div>
      </div>

      <div className="dy-mode-bar">
        {MODES.map(m => (
          <button
            key={m}
            className={`dy-mode-btn ${mode === m ? 'dy-mode-btn-active' : ''}`}
            onClick={() => setMode(m)}
          >
            {MODE_CONFIG[m].name}
          </button>
        ))}
      </div>

      {/* book_memo: 本タイトル・ページ範囲 */}
      {mode === 'book_memo' && (
        <div className="dy-meta-row">
          <input
            className="dy-meta-input dy-meta-title"
            placeholder="本のタイトル"
            value={ms.bookTitle}
            onChange={e => setField('bookTitle', e.target.value)}
            aria-label="本のタイトル"
          />
          <span className="dy-meta-label">p.</span>
          <input
            className="dy-meta-input dy-meta-page"
            placeholder="001"
            value={ms.startPage}
            onChange={e => setField('startPage', e.target.value.replace(/\D/g, ''))}
            maxLength={4}
            aria-label="開始ページ"
          />
          <span className="dy-meta-sep">–</span>
          <input
            className="dy-meta-input dy-meta-page"
            placeholder="050"
            value={ms.endPage}
            onChange={e => setField('endPage', e.target.value.replace(/\D/g, ''))}
            maxLength={4}
            aria-label="終了ページ"
          />
        </div>
      )}

      {/* study: 分野名 */}
      {mode === 'study' && (
        <div className="dy-meta-row">
          <input
            className="dy-meta-input dy-meta-title"
            placeholder="学習分野（例: 線形代数・React・英語）"
            value={ms.subject}
            onChange={e => setField('subject', e.target.value)}
            aria-label="学習分野"
          />
        </div>
      )}

      <div className="dy-layout">

        {/* ===== LEFT: 入力 + 箇条書き ===== */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          <div className="dy-panel">
            <div className="dy-panel-title">テキスト入力</div>
            <textarea
              className="dy-textarea dy-input-area"
              placeholder={MODE_CONFIG[mode].placeholder}
              value={text}
              onChange={e => setField('text', e.target.value)}
              rows={10}
              aria-label="テキスト入力"
            />
          </div>

          <div className="dy-panel">
            <div className="dy-panel-title-row">
              <span className="dy-panel-title">箇条書きプレビュー</span>
              <span className="dy-count">{bullets.length} 件</span>
            </div>
            {bullets.length > 0 ? (
              <pre className="dy-bullets-preview">{bulletsText}</pre>
            ) : (
              <div className="dy-empty">書くとここに表示されます</div>
            )}
            <div className="dy-actions">
              <button
                className="dy-btn dy-btn-primary"
                onClick={copyPrompt}
                disabled={bullets.length === 0}
                title="LLMに貼り付けてサマリ・キーワードを生成させてください"
              >
                📋 プロンプトをコピー
              </button>
            </div>
          </div>

        </div>

        {/* ===== RIGHT: LLM返答 + エクスポート ===== */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          <div className="dy-panel">
            <div className="dy-panel-title">LLMの返答を貼り付ける</div>
            <div className="dy-hint">
              プロンプトをLLM（Claude等）に送り、返答をそのまま貼り付けてください。<br />
              【サマリ】【キーワード】が自動で認識されます。
            </div>
            <textarea
              className="dy-textarea dy-llm-area"
              placeholder={"【サマリ】\n（LLMの要約がここに入ります）\n\n【キーワード】\n・キーワード1\n・キーワード2"}
              value={llmResponse}
              onChange={e => setField('llmResponse', e.target.value)}
              rows={12}
              aria-label="LLM返答"
            />
            {llmResponse && (
              <button
                className="dy-btn dy-btn-ghost dy-btn-sm"
                onClick={() => setField('llmResponse', '')}
                style={{ marginTop: 6 }}
              >
                クリア
              </button>
            )}
          </div>

          {/* 認識済みプレビュー */}
          {llmResponse.trim() && (
            <div className="dy-panel dy-parsed-panel">
              <div className="dy-panel-title">認識結果</div>

              <div className="dy-parsed-section">
                <div className="dy-parsed-label">サマリ</div>
                <div className="dy-parsed-body">
                  {summary || <span className="dy-empty-inline">【サマリ】が見つかりません</span>}
                </div>
              </div>

              <div className="dy-parsed-section">
                <div className="dy-parsed-label">キーワード</div>
                <div className="dy-parsed-body">
                  {keywords.length > 0
                    ? keywords.map((k, i) => (
                        <span key={i} className="dy-keyword-chip">
                          <span className="dy-keyword-word">{k.word}</span>
                          {k.desc && <span className="dy-keyword-desc">{k.desc}</span>}
                        </span>
                      ))
                    : <span className="dy-empty-inline">【キーワード】が見つかりません</span>
                  }
                </div>
              </div>
            </div>
          )}

          <div className="dy-panel">
            <div className="dy-panel-title">.txt として保存</div>
            <div className="dy-hint">
              {mode === 'nippo'
                ? '```で囲んだ形式で本文・サマリ・キーワードを保存します。'
                : 'ASCII art形式で本文・サマリ・キーワードを1ファイルにまとめて保存します。'}
            </div>
            <div className="dy-actions">
              <button
                className="dy-btn dy-btn-primary"
                onClick={exportTxt}
                disabled={bullets.length === 0}
              >
                💾 {filename} を保存
              </button>
            </div>

            {bullets.length > 0 && (
              <details className="dy-preview-details">
                <summary className="dy-preview-summary">ファイルプレビュー</summary>
                <pre className="dy-txt-preview">
                  {generateTxtContent(dateLabel, bullets, summary, keywords, mode)}
                </pre>
              </details>
            )}
          </div>

        </div>
      </div>

      {toast && <div className="dy-toast">{toast}</div>}
    </div>
  );
};

export default Diary;
