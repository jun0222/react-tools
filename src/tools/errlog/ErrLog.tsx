import { useState, useCallback, useEffect, useRef } from 'react';
import mermaid from 'mermaid';
import { useTheme } from '../../context/ThemeContext';
import {
  loadRecords, saveRecords, createRecord,
  addRecord, deleteRecord, filterRecords,
  generatePrompt, extractMermaid,
} from './errlogCore';
import type { ErrorRecord } from './errlogCore';
import './ErrLog.css';

let renderSeq = 0;

const formatDate = (iso: string) => {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

// Renders mermaid code into a container div
const useMermaidRenderer = (
  ref: React.RefObject<HTMLDivElement | null>,
  code: string | null,
  dark: boolean,
) => {
  useEffect(() => {
    if (!ref.current) return;
    if (!code) { ref.current.innerHTML = ''; return; }
    const id = `el-svg-${++renderSeq}`;
    mermaid.initialize({ startOnLoad: false, theme: dark ? 'dark' : 'default' });
    mermaid.render(id, code)
      .then(({ svg }) => { if (ref.current) ref.current.innerHTML = svg; })
      .catch(() => { if (ref.current) ref.current.innerHTML = '<span style="color:#f87171;font-size:12px">Mermaid parse error</span>'; });
  }, [ref, code, dark]);
};

const ErrLog = () => {
  const { dark } = useTheme();
  const [records, setRecords] = useState<ErrorRecord[]>(() => loadRecords());
  const [query, setQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Step 1: error input
  const [errorText, setErrorText] = useState('');

  // Step 2: response recording
  const [response, setResponse] = useState('');
  const [debouncedResponse, setDebouncedResponse] = useState('');
  const [title, setTitle] = useState('');

  const [toast, setToast] = useState('');

  // Mermaid refs
  const previewRef = useRef<HTMLDivElement>(null);
  const expandedRef = useRef<HTMLDivElement>(null);

  useEffect(() => { saveRecords(records); }, [records]);

  // Debounce response for mermaid preview
  useEffect(() => {
    const t = setTimeout(() => setDebouncedResponse(response), 600);
    return () => clearTimeout(t);
  }, [response]);

  const previewMermaid = debouncedResponse ? extractMermaid(debouncedResponse) : null;
  useMermaidRenderer(previewRef, previewMermaid, dark);

  // Mermaid for expanded record
  const expandedRecord = records.find(r => r.id === expandedId) ?? null;
  const expandedMermaid = expandedRecord ? extractMermaid(expandedRecord.response) : null;
  useMermaidRenderer(expandedRef, expandedMermaid, dark);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 1800);
  }, []);

  const handleCopyPrompt = async () => {
    if (!errorText.trim()) return;
    try {
      await navigator.clipboard.writeText(generatePrompt(errorText));
      showToast('プロンプトをコピーしました');
    } catch {
      showToast('コピー失敗');
    }
  };

  const handleSave = () => {
    if (!errorText.trim() || !response.trim()) return;
    const r = createRecord(errorText, title, response);
    setRecords(prev => addRecord(prev, r));
    setErrorText('');
    setResponse('');
    setTitle('');
    setExpandedId(r.id);
    showToast('保存しました');
  };

  const handleDelete = (id: string) => {
    setRecords(prev => deleteRecord(prev, id));
    if (expandedId === id) setExpandedId(null);
    showToast('削除しました');
  };

  const handleCopyResponse = async (r: ErrorRecord) => {
    try {
      await navigator.clipboard.writeText(r.response);
      showToast('コピーしました');
    } catch { showToast('コピー失敗'); }
  };

  const handleReCopyPrompt = async (r: ErrorRecord) => {
    try {
      await navigator.clipboard.writeText(generatePrompt(r.errorText));
      showToast('プロンプトをコピーしました');
    } catch { showToast('コピー失敗'); }
  };

  const filtered = filterRecords(records, query);

  return (
    <div className={`errlog ${dark ? 'dark' : 'light'}`}>
      <header className="el-header">
        <div className="el-logo">🐛</div>
        <h1><span className="accent">ErrLog</span></h1>
      </header>

      {/* ===== STEP 1: Paste error ===== */}
      <div className="el-panel">
        <div className="el-step-label">① エラーを貼り付ける</div>
        <textarea
          className="el-textarea"
          placeholder={'エラーメッセージ・スタックトレースをここに貼り付けてください。'}
          value={errorText}
          onChange={e => setErrorText(e.target.value)}
          rows={6}
          aria-label="エラー内容"
        />
        <button
          className="el-copy-prompt-btn"
          onClick={handleCopyPrompt}
          disabled={!errorText.trim()}
        >
          📋 プロンプトをコピーして LLM に聞く
        </button>
      </div>

      {/* ===== STEP 2: Record response ===== */}
      <div className="el-panel">
        <div className="el-step-label">② LLM の返答を記録する</div>
        <textarea
          className="el-textarea"
          placeholder={'LLM から受け取った返答をここに貼り付けてください。\nMermaid ダイアグラムとコードブロックがプレビューされます。'}
          value={response}
          onChange={e => setResponse(e.target.value)}
          rows={8}
          aria-label="LLMの返答"
        />

        {/* Mermaid preview */}
        {previewMermaid && (
          <div className="el-mermaid-wrap">
            <div className="el-mermaid-label">Mermaid プレビュー</div>
            <div ref={previewRef} />
          </div>
        )}
        {previewMermaid === null && debouncedResponse && (
          <div ref={previewRef} style={{ display: 'none' }} />
        )}

        <div className="el-save-row">
          <input
            className="el-input"
            placeholder="タイトル（省略するとエラー文の先頭を使用）"
            value={title}
            onChange={e => setTitle(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleSave(); }}
            aria-label="タイトル"
          />
          <button
            className="el-btn el-btn-green"
            onClick={handleSave}
            disabled={!errorText.trim() || !response.trim()}
          >
            保存
          </button>
        </div>
      </div>

      {/* ===== Records ===== */}
      <div className="el-panel">
        <div className="el-panel-title">記録一覧</div>
        <div className="el-search-row">
          <input
            className="el-input el-search"
            placeholder="検索..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            aria-label="検索"
          />
          <span className="el-count">{filtered.length} 件</span>
        </div>

        {filtered.length === 0 && (
          <div className="el-empty">
            {records.length === 0
              ? 'エラーを保存するとここに表示されます。'
              : '条件に合う記録がありません。'}
          </div>
        )}

        {filtered.map(r => {
          const isOpen = expandedId === r.id;
          return (
            <div key={r.id} className="el-record">
              <div
                className="el-record-header"
                onClick={() => setExpandedId(isOpen ? null : r.id)}
                aria-expanded={isOpen}
              >
                <span className="el-record-title">{r.title}</span>
                <span className="el-record-date">{formatDate(r.createdAt)}</span>
                <span className={`el-record-chevron ${isOpen ? 'open' : ''}`}>▼</span>
              </div>

              {isOpen && (
                <div className="el-record-body">
                  <div className="el-record-section-label">エラー内容</div>
                  <div className="el-record-error">{r.errorText}</div>

                  {expandedMermaid && r.id === expandedId && (
                    <div className="el-mermaid-wrap" style={{ marginTop: 12 }}>
                      <div className="el-mermaid-label">Mermaid プレビュー</div>
                      <div ref={expandedRef} />
                    </div>
                  )}

                  <div className="el-record-section-label">LLM の返答</div>
                  <pre className="el-record-response">{r.response}</pre>

                  <div className="el-record-actions">
                    <button
                      className="el-btn el-btn-ghost el-btn-sm"
                      onClick={() => handleReCopyPrompt(r)}
                    >
                      プロンプト再コピー
                    </button>
                    <button
                      className="el-btn el-btn-ghost el-btn-sm"
                      onClick={() => handleCopyResponse(r)}
                    >
                      返答コピー
                    </button>
                    <button
                      className="el-btn el-btn-ghost el-btn-sm"
                      style={{ color: 'var(--el-accent)' }}
                      onClick={() => handleDelete(r.id)}
                    >
                      削除
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {toast && <div className="el-toast">{toast}</div>}
    </div>
  );
};

export default ErrLog;
