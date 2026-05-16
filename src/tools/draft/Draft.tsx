import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import mermaid from 'mermaid';
import { useTheme } from '../../context/ThemeContext';
import {
  countChars, countSentences, avgSentenceLength, estimateReadingTimeSec,
  getChatLevel, getSentenceLengthInfo, getSentenceCountInfo,
  FRAMEWORKS, DEFAULT_FLOWCHART, generateSlimPrompt,
} from './draftCore';
import './Draft.css';

let renderSeq = 0;

const STORAGE_KEY = 'draft-state';

const loadState = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as { draft: string; mapCode: string; input?: string };
  } catch { /* ignore */ }
  return { draft: '', mapCode: DEFAULT_FLOWCHART, input: '' };
};

// Auto-insert <br> every WRAP_CHARS characters in flowchart node labels
// so long Japanese labels wrap inside the box
const WRAP_CHARS = 7;
const wrapFlowchartLabels = (code: string): string =>
  code
    .replace(/\[([^\]"<]+)\]/g, (_, label) => {
      if (label.length <= WRAP_CHARS) return `[${label}]`;
      const chunks = label.match(/[\s\S]{1,7}/g) ?? [label];
      return `["${chunks.join('<br>')}"]`;
    })
    .replace(/\(([^)"<]+)\)/g, (_, label) => {
      if (label.length <= WRAP_CHARS) return `(${label})`;
      const chunks = label.match(/[\s\S]{1,7}/g) ?? [label];
      return `("${chunks.join('<br>')}")`;
    })
    .replace(/\{([^}"<]+)\}/g, (_, label) => {
      if (label.length <= WRAP_CHARS) return `{${label}}`;
      const chunks = label.match(/[\s\S]{1,7}/g) ?? [label];
      return `{"${chunks.join('<br>')}"}`;
    });

const Draft = () => {
  const { dark } = useTheme();

  const init = useMemo(loadState, []);
  const [mapCode, setMapCode] = useState(init.mapCode);
  const [debouncedMap, setDebouncedMap] = useState(mapCode);
  const [hasSvg, setHasSvg] = useState(false);
  // previewRef の内側に React 管理の子を置かない（mermaid との競合を防ぐ）
  const previewRef = useRef<HTMLDivElement>(null);

  const [frameworkId, setFrameworkId] = useState(FRAMEWORKS[0].id);
  const [fieldValues, setFieldValues] = useState<Record<string, Record<string, string>>>({});

  const [draft, setDraft] = useState(init.draft);
  const [input, setInput] = useState(init.input ?? '');
  const [toast, setToast] = useState('');

  const activeFramework = FRAMEWORKS.find(f => f.id === frameworkId) ?? FRAMEWORKS[0];
  const currentFields = fieldValues[frameworkId] ?? {};

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ draft, mapCode, input }));
    } catch { /* ignore */ }
  }, [draft, mapCode, input]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedMap(mapCode), 500);
    return () => clearTimeout(t);
  }, [mapCode]);

  useEffect(() => {
    if (!previewRef.current) return;
    if (!debouncedMap.trim()) {
      previewRef.current.innerHTML = '';
      setHasSvg(false);
      return;
    }
    const id = `dr-svg-${++renderSeq}`;
    mermaid.initialize({ startOnLoad: false, theme: dark ? 'dark' : 'default' });
    mermaid.render(id, wrapFlowchartLabels(debouncedMap))
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

  const copySlim = async () => {
    if (!draft.trim()) return;
    try {
      await navigator.clipboard.writeText(generateSlimPrompt(draft));
      showToast('削減プロンプトをコピーしました');
    } catch { showToast('コピー失敗'); }
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
  const readLabel = readSec < 60 ? `${readSec}秒` : `${Math.round(readSec / 60)}分`;

  return (
    <div className={`draft ${dark ? 'dark' : 'light'}`}>
      <div className="dr-header">
        <div className="dr-logo-icon">✍️</div>
        <h1><span className="accent">Draft</span></h1>
      </div>

      <div className="dr-layout">
        {/* ===== LEFT ===== */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* 論点整理 */}
          <div className="dr-panel">
            <div className="dr-panel-title">論点整理</div>

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
          </div>

          {/* フロー図 */}
          <div className="dr-panel">
            <div className="dr-panel-title">フロー図</div>
            <div className="dr-map-actions">
              <button
                className="dr-btn dr-btn-ghost dr-btn-sm"
                onClick={() => setMapCode(DEFAULT_FLOWCHART)}
              >
                テンプレートに戻す
              </button>
              <button
                className="dr-btn dr-btn-ghost dr-btn-sm"
                onClick={async () => {
                  await navigator.clipboard.writeText(wrapFlowchartLabels(mapCode)).catch(() => {});
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
              rows={8}
              spellCheck={false}
              aria-label="フロー図コード"
              placeholder={DEFAULT_FLOWCHART}
            />

            <div className="dr-panel-title" style={{ marginBottom: 6, marginTop: 10 }}>プレビュー</div>
            {!hasSvg && (
              <div className="dr-preview-box">
                <span className="dr-preview-empty">コードを入力するとここに表示されます</span>
              </div>
            )}
            <div ref={previewRef} className={hasSvg ? 'dr-preview-box' : ''} />

            <div style={{ fontSize: 11, color: 'var(--dr-text-dim)', marginTop: 8, lineHeight: 1.7 }}>
              <strong>書き方:</strong>{' '}
              <code>flowchart TD</code> で開始 →{' '}
              <code>A[ラベル] --- B[ラベル]</code> で接続。
              ラベルが7文字を超えるとプレビュー・コピー時に自動折り返し。
            </div>
          </div>
        </div>

        {/* ===== RIGHT ===== */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="dr-panel">
            <div className="dr-panel-title">インプット</div>
            <textarea
              className="dr-draft-textarea"
              placeholder="参考にしたい文章・資料・メモをここに置いておきます。"
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
                  <button className="dr-btn dr-btn-ghost dr-btn-sm" onClick={copySlim} title="理科系の作文技術に則り10/30/50/70/90%削減の5案を出すプロンプトをコピー">✂️ 削減5案</button>
                  <button className="dr-btn dr-btn-primary dr-btn-sm" onClick={copy}>コピー</button>
                </>
              )}
            </div>
          </div>

          {/* Metrics */}
          <div className="dr-panel">
            <div className="dr-panel-title">チャット指標</div>

            <div className="dr-metric-row" style={{ marginBottom: 6 }}>
              <span className="dr-metric-label">文字数</span>
              <span className={`dr-metric-value chars-${chatLevel.level}`}>{chars}</span>
            </div>
            <div className="dr-gauge-wrap" style={{ marginBottom: 12 }}>
              <div className={`dr-gauge-fill ${chatLevel.level}`} style={{ width: `${gaugePct}%` }} />
            </div>

            <div className="dr-suggestion" style={{ marginBottom: 12 }}>
              <span className="dr-suggestion-emoji">{chatLevel.emoji}</span>
              <strong className={`chars-${chatLevel.level}`}>{chatLevel.label}</strong>
              {'　'}
              {chatLevel.suggestion}
            </div>

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
