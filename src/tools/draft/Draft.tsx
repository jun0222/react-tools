import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import mermaid from 'mermaid';
import { useTheme } from '../../context/ThemeContext';
import {
  countChars, countSentences, avgSentenceLength, estimateReadingTimeSec,
  getChatLevel, getSentenceLengthInfo, getSentenceCountInfo,
  FRAMEWORKS, DEFAULT_MINDMAP,
} from './draftCore';
import './Draft.css';

let renderSeq = 0;

type StructureTab = 'mindmap' | 'framework';

const STORAGE_KEY = 'draft-state';

const loadState = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as { draft: string; mapCode: string; input?: string };
  } catch { /* ignore */ }
  return { draft: '', mapCode: DEFAULT_MINDMAP, input: '' };
};

const Draft = () => {
  const { dark } = useTheme();

  const init = useMemo(loadState, []);
  const [structTab, setStructTab] = useState<StructureTab>('mindmap');
  const [mapCode, setMapCode] = useState(init.mapCode);
  const [debouncedMap, setDebouncedMap] = useState(mapCode);
  const [hasSvg, setHasSvg] = useState(false);
  // React の差分更新との競合を避けるため、mermaid の描画先は ref のみで管理し
  // JSX 側には React 管理の子要素を一切置かない
  const previewRef = useRef<HTMLDivElement>(null);

  const [frameworkId, setFrameworkId] = useState(FRAMEWORKS[0].id);
  const [fieldValues, setFieldValues] = useState<Record<string, Record<string, string>>>({});

  const [draft, setDraft] = useState(init.draft);
  const [input, setInput] = useState(init.input ?? '');
  const [toast, setToast] = useState('');

  const activeFramework = FRAMEWORKS.find(f => f.id === frameworkId) ?? FRAMEWORKS[0];
  const currentFields = fieldValues[frameworkId] ?? {};

  // Persist draft + map
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ draft, mapCode, input })); } catch { /* ignore */ }
  }, [draft, mapCode, input]);

  // Debounce mindmap
  useEffect(() => {
    const t = setTimeout(() => setDebouncedMap(mapCode), 500);
    return () => clearTimeout(t);
  }, [mapCode]);

  // Render mermaid mindmap
  useEffect(() => {
    if (!previewRef.current) return;
    if (!debouncedMap.trim()) {
      previewRef.current.innerHTML = '';
      setHasSvg(false);
      return;
    }
    const id = `dr-svg-${++renderSeq}`;
    mermaid.initialize({ startOnLoad: false, theme: dark ? 'dark' : 'default' });
    mermaid.render(id, debouncedMap)
      .then(({ svg }) => {
        if (previewRef.current) {
          previewRef.current.innerHTML = svg;
          setHasSvg(true);
        }
      })
      .catch(() => { /* keep last good SVG */ });
  }, [debouncedMap, dark]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 1800);
  }, []);

  const draftRef = useRef(draft);
  useEffect(() => { draftRef.current = draft; }, [draft]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        const text = draftRef.current;
        if (!text.trim()) return;
        navigator.clipboard.writeText(text).then(
          () => showToast('コピーしました'),
          () => showToast('コピー失敗'),
        );
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [showToast]);

  const setField = (key: string, value: string) => {
    setFieldValues(prev => ({
      ...prev,
      [frameworkId]: { ...prev[frameworkId], [key]: value },
    }));
  };

  const applyFramework = () => {
    const generated = activeFramework.generate(currentFields);
    if (!generated.trim()) return;
    setDraft(prev => prev ? `${prev}\n\n${generated}` : generated);
    showToast('ドラフトに追記しました');
  };

  const copy = async () => {
    if (!draft.trim()) return;
    try { await navigator.clipboard.writeText(draft); showToast('コピーしました'); }
    catch { showToast('コピー失敗'); }
  };

  // Metrics
  const chars = countChars(draft);
  const sentences = countSentences(draft);
  const avgLen = avgSentenceLength(draft);
  const readSec = estimateReadingTimeSec(draft);
  const chatLevel = getChatLevel(chars);
  const sentLenInfo = getSentenceLengthInfo(avgLen);
  const sentCountInfo = getSentenceCountInfo(sentences);

  const gaugeMax = 1500;
  const gaugePct = Math.min((chars / gaugeMax) * 100, 100);

  const readLabel = readSec < 60
    ? `${readSec}秒`
    : `${Math.round(readSec / 60)}分`;

  return (
    <div className={`draft ${dark ? 'dark' : 'light'}`}>
      <div className="dr-header">
        <div className="dr-logo-icon">✍️</div>
        <h1><span className="accent">Draft</span></h1>
      </div>

      <div className="dr-layout">
        {/* ===== LEFT: Structure tools ===== */}
        <div className="dr-panel">
          <div className="dr-tabs">
            <button
              className={`dr-tab ${structTab === 'mindmap' ? 'dr-tab-active' : ''}`}
              onClick={() => setStructTab('mindmap')}
            >
              🗺 マインドマップ
            </button>
            <button
              className={`dr-tab ${structTab === 'framework' ? 'dr-tab-active' : ''}`}
              onClick={() => setStructTab('framework')}
            >
              📐 論点整理
            </button>
          </div>

          {/* ===== Mindmap ===== */}
          {structTab === 'mindmap' && (
            <div className="dr-map-editor">
              <div className="dr-map-actions">
                <button
                  className="dr-btn dr-btn-ghost dr-btn-sm"
                  onClick={() => setMapCode(DEFAULT_MINDMAP)}
                >
                  テンプレートに戻す
                </button>
                <button
                  className="dr-btn dr-btn-ghost dr-btn-sm"
                  onClick={async () => {
                    await navigator.clipboard.writeText(mapCode).catch(() => {});
                    showToast('コピーしました');
                  }}
                >
                  コード コピー
                </button>
              </div>

              <textarea
                className="dr-code-area"
                value={mapCode}
                onChange={e => setMapCode(e.target.value)}
                rows={10}
                spellCheck={false}
                aria-label="マインドマップコード"
                placeholder={DEFAULT_MINDMAP}
              />

              <div className="dr-panel-title" style={{ marginBottom: 6 }}>プレビュー</div>
              {/* previewRef div の内側には React 管理の子を置かない。
                  React の diff が innerHTML と競合して removeChild エラーになるのを防ぐ。
                  プレースホルダーは別要素として並置する。 */}
              {!hasSvg && (
                <div className="dr-preview-box">
                  <span className="dr-preview-empty">mindmap コードを入力するとここに表示されます</span>
                </div>
              )}
              <div ref={previewRef} className={hasSvg ? 'dr-preview-box' : ''} />

              <div style={{ fontSize: 11, color: 'var(--dr-text-dim)', marginTop: 6, lineHeight: 1.6 }}>
                <strong>書き方のヒント:</strong><br />
                <code>mindmap</code> の次の行から 2 スペースインデントでノードを追加。<br />
                <code>root((中心テーマ))</code> が中心、<code>ノード名</code> でサブトピック。
              </div>
            </div>
          )}

          {/* ===== Framework ===== */}
          {structTab === 'framework' && (
            <>
              <div className="dr-framework-selector">
                {FRAMEWORKS.map(f => (
                  <button
                    key={f.id}
                    className={`dr-framework-chip ${frameworkId === f.id ? 'dr-framework-chip-active' : ''}`}
                    onClick={() => setFrameworkId(f.id)}
                  >
                    {f.name}
                  </button>
                ))}
              </div>

              <div className="dr-framework-desc">{activeFramework.desc}</div>

              <div className="dr-fields">
                {activeFramework.fields.map(field => (
                  <div key={field.key} className="dr-field-row">
                    <label className="dr-field-label" htmlFor={`field-${field.key}`}>
                      {field.label}
                    </label>
                    <textarea
                      id={`field-${field.key}`}
                      className="dr-field-textarea"
                      placeholder={field.placeholder}
                      value={currentFields[field.key] ?? ''}
                      onChange={e => setField(field.key, e.target.value)}
                      rows={2}
                      aria-label={field.label}
                    />
                  </div>
                ))}
              </div>

              <div className="dr-framework-apply-row">
                <button
                  className="dr-btn dr-btn-primary"
                  onClick={applyFramework}
                  disabled={Object.values(currentFields).every(v => !v?.trim())}
                >
                  ドラフトに追記 →
                </button>
              </div>
            </>
          )}
        </div>

        {/* ===== RIGHT: Input + Draft + Metrics ===== */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="dr-panel">
            <div className="dr-panel-title">インプット</div>
            <textarea
              className="dr-draft-textarea"
              placeholder={'参考にしたい文章・資料・メモをここに置いておきます。'}
              value={input}
              onChange={e => setInput(e.target.value)}
              rows={6}
              aria-label="インプット"
            />
            {input && (
              <div className="dr-draft-actions">
                <button className="dr-btn dr-btn-ghost dr-btn-sm" onClick={() => setInput('')}>クリア</button>
              </div>
            )}
          </div>

          <div className="dr-panel">
            <div className="dr-panel-title">下書き</div>
            <textarea
              className="dr-draft-textarea"
              placeholder={'ここにチャットで送る文章を書きます。&#10;左パネルで論点を整理してから「ドラフトに追記」を押すと流し込めます。'}
              value={draft}
              onChange={e => setDraft(e.target.value)}
              rows={12}
              aria-label="下書き"
            />
            <div className="dr-draft-actions">
              {draft && (
                <>
                  <button className="dr-btn dr-btn-ghost dr-btn-sm" onClick={() => setDraft('')}>クリア</button>
                  <button className="dr-btn dr-btn-primary dr-btn-sm" onClick={copy}>コピー</button>
                </>
              )}
            </div>
          </div>

          {/* Metrics panel */}
          <div className="dr-panel">
            <div className="dr-panel-title">チャット指標</div>

            {/* Gauge */}
            <div className="dr-metric-row" style={{ marginBottom: 6 }}>
              <span className="dr-metric-label">文字数</span>
              <span className={`dr-metric-value chars-${chatLevel.level}`}>{chars}</span>
            </div>
            <div className="dr-gauge-wrap" style={{ marginBottom: 12 }}>
              <div
                className={`dr-gauge-fill ${chatLevel.level}`}
                style={{ width: `${gaugePct}%` }}
              />
            </div>

            {/* Channel suggestion */}
            <div className="dr-suggestion" style={{ marginBottom: 12 }}>
              <span className="dr-suggestion-emoji">{chatLevel.emoji}</span>
              <strong className={`chars-${chatLevel.level}`}>{chatLevel.label}</strong>
              {'　'}
              {chatLevel.suggestion}
            </div>

            {/* Detail metrics */}
            <div className="dr-metric-row">
              <span className="dr-metric-label">文の数</span>
              <span className={`dr-info-label ${sentCountInfo.level}`}>{sentCountInfo.label}</span>
              <span className="dr-metric-value">{sentences} 文</span>
            </div>

            <div className="dr-metric-row" style={{ marginTop: 6 }}>
              <span className="dr-metric-label">平均文長</span>
              <span className={`dr-info-label ${sentLenInfo.level}`}>{sentLenInfo.label}</span>
              <span className="dr-metric-value">{avgLen} 字 / 文</span>
            </div>

            <div className="dr-metric-row" style={{ marginTop: 6 }}>
              <span className="dr-metric-label">読了目安</span>
              <span className="dr-metric-value" style={{ marginLeft: 'auto' }}>{chars ? readLabel : '—'}</span>
            </div>
          </div>
        </div>
      </div>

      {toast && <div className="dr-toast">{toast}</div>}
    </div>
  );
};

export default Draft;
