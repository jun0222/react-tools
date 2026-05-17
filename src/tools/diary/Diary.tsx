import { useState, useEffect, useCallback } from 'react';
import { useTheme } from '../../context/ThemeContext';
import {
  type DiaryMode,
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
const STORAGE_KEY = 'diary-state-v2';

type ModeState = { text: string; llmResponse: string };
type AllState = Record<DiaryMode, ModeState>;

const EMPTY_MODE: ModeState = { text: '', llmResponse: '' };

const loadState = (): AllState => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as AllState;
  } catch { /* ignore */ }
  return { diary: { ...EMPTY_MODE }, book_memo: { ...EMPTY_MODE }, research: { ...EMPTY_MODE } };
};

const Diary = () => {
  const { dark } = useTheme();
  const [mode, setMode] = useState<DiaryMode>('diary');
  const [allState, setAllState] = useState<AllState>(loadState);
  const [toast, setToast] = useState('');

  const text        = allState[mode].text;
  const llmResponse = allState[mode].llmResponse;
  const setText        = (v: string) => setAllState(prev => ({ ...prev, [mode]: { ...prev[mode], text: v } }));
  const setLlmResponse = (v: string) => setAllState(prev => ({ ...prev, [mode]: { ...prev[mode], llmResponse: v } }));

  const dateLabel = getDateLabel();
  const bullets = toBullets(text);
  const bulletsText = formatBullets(bullets);
  const { summary, keywords } = parseLLMResponse(llmResponse);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(allState));
    } catch { /* ignore */ }
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
    a.download = generateFilename(mode);
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

      <div className="dy-layout">

        {/* ===== LEFT: 入力 + 箇条書き ===== */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          <div className="dy-panel">
            <div className="dy-panel-title">日記を書く</div>
            <textarea
              className="dy-textarea dy-input-area"
              placeholder={MODE_CONFIG[mode].placeholder}
              value={text}
              onChange={e => setText(e.target.value)}
              rows={10}
              aria-label="日記入力"
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
              <div className="dy-empty">日記を書くとここに表示されます</div>
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
              onChange={e => setLlmResponse(e.target.value)}
              rows={12}
              aria-label="LLM返答"
            />
            {llmResponse && (
              <button
                className="dy-btn dy-btn-ghost dy-btn-sm"
                onClick={() => setLlmResponse('')}
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
              ASCII art形式で本文・サマリ・キーワードを1ファイルにまとめて保存します。
            </div>
            <div className="dy-actions">
              <button
                className="dy-btn dy-btn-primary"
                onClick={exportTxt}
                disabled={bullets.length === 0}
              >
                💾 {generateFilename()} を保存
              </button>
            </div>

            {/* .txt preview */}
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
