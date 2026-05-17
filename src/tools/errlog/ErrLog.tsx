import { useState, useCallback, useEffect, useRef } from 'react';
import mermaid from 'mermaid';
import { useTheme } from '../../context/ThemeContext';
import {
  generatePrompt, extractMermaid,
  generateMarkdown, generateFilename,
} from './errlogCore';
import './ErrLog.css';

let renderSeq = 0;

const ErrLog = () => {
  const { dark } = useTheme();
  const [errorText, setErrorText] = useState('');
  const [response, setResponse] = useState('');
  const [debouncedResponse, setDebouncedResponse] = useState('');
  const [title, setTitle] = useState('');
  const [toast, setToast] = useState('');

  const previewRef = useRef<HTMLDivElement>(null);

  // Debounce response for mermaid preview
  useEffect(() => {
    const t = setTimeout(() => setDebouncedResponse(response), 600);
    return () => clearTimeout(t);
  }, [response]);

  // Render mermaid from debounced response
  useEffect(() => {
    if (!previewRef.current) return;
    const code = debouncedResponse ? extractMermaid(debouncedResponse) : null;
    if (!code) { previewRef.current.innerHTML = ''; return; }
    const id = `el-svg-${++renderSeq}`;
    mermaid.initialize({ startOnLoad: false, theme: dark ? 'dark' : 'default' });
    mermaid.render(id, code)
      .then(({ svg }) => { if (previewRef.current) previewRef.current.innerHTML = svg; })
      .catch(() => {
        if (previewRef.current)
          previewRef.current.innerHTML = '<span style="color:#f87171;font-size:12px">Mermaid parse error</span>';
      });
  }, [debouncedResponse, dark]);

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
    const md = generateMarkdown(title, errorText, response);
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = generateFilename();
    a.click();
    URL.revokeObjectURL(url);
    setErrorText('');
    setResponse('');
    setTitle('');
    showToast('保存しました');
  };

  const hasMermaid = debouncedResponse ? extractMermaid(debouncedResponse) !== null : false;

  return (
    <div className={`errlog ${dark ? 'dark' : 'light'}`}>
      <header className="el-header">
        <div className="el-logo">🐛</div>
        <h1><span className="accent">ErrLog</span></h1>
      </header>

      {/* ===== STEP 1 ===== */}
      <div className="el-panel">
        <div className="el-step-label">① エラーを貼り付ける</div>
        <textarea
          className="el-textarea"
          placeholder="エラーメッセージ・スタックトレースをここに貼り付けてください。"
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

      {/* ===== STEP 2 ===== */}
      <div className="el-panel">
        <div className="el-step-label">② 解決方法を記録する</div>
        <textarea
          className="el-textarea"
          placeholder={'LLM から受け取った返答をここに貼り付けてください。\nMermaid ダイアグラムが含まれていれば自動でプレビューされます。'}
          value={response}
          onChange={e => setResponse(e.target.value)}
          rows={10}
          aria-label="LLMの返答"
        />

        {hasMermaid && (
          <div className="el-mermaid-wrap">
            <div className="el-mermaid-label">Mermaid プレビュー</div>
            <div ref={previewRef} />
          </div>
        )}
        {!hasMermaid && <div ref={previewRef} style={{ display: 'none' }} />}

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
            .md 保存
          </button>
        </div>
      </div>

      {toast && <div className="el-toast">{toast}</div>}
    </div>
  );
};

export default ErrLog;
