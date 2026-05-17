import { useState, useCallback } from 'react';
import { Terminal, Plus, X, Copy, Check } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import {
  tokenize,
  applyMappings,
  diffIndices,
  buildResult,
  type Mapping,
} from './argsCore';
import './Args.css';

const STORAGE_KEY = 'args-state-v1';

const loadCmd = () => {
  try { return localStorage.getItem(STORAGE_KEY) ?? ''; } catch { return ''; }
};

let idCounter = 0;

type MappingRow = Mapping & { id: number };

const Args = () => {
  const { dark } = useTheme();
  const [cmd,      setCmd]      = useState(loadCmd);
  const [rows,     setRows]     = useState<MappingRow[]>([]);
  const [copied,   setCopied]   = useState(false);

  const tokens   = tokenize(cmd);
  const modified = applyMappings(tokens, rows);
  const changed  = diffIndices(tokens, modified);
  const result   = buildResult(modified);

  const saveCmd = (v: string) => {
    setCmd(v);
    try { localStorage.setItem(STORAGE_KEY, v); } catch { /* ignore */ }
  };

  const addMapping = useCallback((index: number) => {
    setRows(prev => {
      if (prev.some(r => r.index === index)) return prev;
      return [...prev, { id: ++idCounter, index, replacement: '' }];
    });
  }, []);

  const updateRow = (id: number, replacement: string) =>
    setRows(prev => prev.map(r => r.id === id ? { ...r, replacement } : r));

  const removeRow = (id: number) =>
    setRows(prev => prev.filter(r => r.id !== id));

  const copyResult = async () => {
    if (!result) return;
    await navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className={`args-tool ${dark ? 'dark' : 'light'}`}>
      <div className="ag-header">
        <div className="ag-logo"><Terminal size={22} color="white" /></div>
        <div>
          <h1>Args</h1>
          <p className="ag-sub">コマンドの変数をマッピングで置換、diff確認</p>
        </div>
      </div>

      {/* ===== コマンド入力 ===== */}
      <div className="ag-section">
        <div className="ag-label">コマンド</div>
        <input
          className="ag-cmd-input"
          value={cmd}
          onChange={e => saveCmd(e.target.value)}
          placeholder="例: kubectl get pods -n default --context cluster1"
          spellCheck={false}
          aria-label="コマンド入力"
        />
      </div>

      {/* ===== トークン表示 ===== */}
      {tokens.length > 0 && (
        <div className="ag-section">
          <div className="ag-label">トークン <span className="ag-hint">クリックでマッピング追加</span></div>
          <div className="ag-tokens">
            {tokens.map((tok, i) => (
              <button
                key={i}
                className={`ag-token ${changed.has(i) ? 'ag-token-changed' : ''} ${rows.some(r => r.index === i) ? 'ag-token-mapped' : ''}`}
                onClick={() => addMapping(i)}
                title={`[${i}] をマッピングに追加`}
              >
                <span className="ag-token-index">{i}</span>
                <span className="ag-token-val">{tok}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="ag-columns">

        {/* ===== マッピングテーブル ===== */}
        <div className="ag-section ag-mapping-section">
          <div className="ag-label">マッピング</div>
          {rows.length === 0 && (
            <div className="ag-empty">トークンをクリックしてマッピングを追加</div>
          )}
          {rows.length > 0 && (
            <table className="ag-table">
              <thead>
                <tr>
                  <th className="ag-th ag-th-idx">#</th>
                  <th className="ag-th">元の値</th>
                  <th className="ag-th">置換後</th>
                  <th className="ag-th ag-th-del" />
                </tr>
              </thead>
              <tbody>
                {rows
                  .slice()
                  .sort((a, b) => a.index - b.index)
                  .map(row => (
                    <tr key={row.id} className="ag-tr">
                      <td className="ag-td ag-td-idx">{row.index}</td>
                      <td className="ag-td ag-td-orig">{tokens[row.index] ?? '–'}</td>
                      <td className="ag-td">
                        <input
                          className="ag-replace-input"
                          value={row.replacement}
                          onChange={e => updateRow(row.id, e.target.value)}
                          placeholder="置換後の値"
                          aria-label={`インデックス${row.index}の置換値`}
                        />
                      </td>
                      <td className="ag-td">
                        <button className="ag-del-btn" onClick={() => removeRow(row.id)} aria-label="削除">
                          <X size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}
          <button
            className="ag-add-btn"
            onClick={() => {
              const next = rows.length ? Math.max(...rows.map(r => r.index)) + 1 : 0;
              if (next < tokens.length) addMapping(next);
            }}
            disabled={tokens.length === 0}
          >
            <Plus size={13} /> 追加
          </button>
        </div>

        {/* ===== diff プレビュー ===== */}
        <div className="ag-section ag-diff-section">
          <div className="ag-label">Diff</div>
          {tokens.length === 0 ? (
            <div className="ag-empty">コマンドを入力してください</div>
          ) : (
            <div className="ag-diff">
              <div className="ag-diff-row ag-diff-before">
                <span className="ag-diff-badge ag-badge-before">Before</span>
                <code className="ag-diff-line">
                  {tokens.map((t, i) => (
                    <span key={i} className={changed.has(i) ? 'ag-removed' : ''}>
                      {i > 0 && ' '}{t}
                    </span>
                  ))}
                </code>
              </div>
              <div className="ag-diff-row ag-diff-after">
                <span className="ag-diff-badge ag-badge-after">After</span>
                <code className="ag-diff-line">
                  {modified.map((t, i) => (
                    <span key={i} className={changed.has(i) ? 'ag-added' : ''}>
                      {i > 0 && ' '}{t}
                    </span>
                  ))}
                </code>
              </div>
            </div>
          )}
          {result && (
            <div className="ag-copy-row">
              <code className="ag-result">{result}</code>
              <button className="ag-copy-btn" onClick={copyResult}>
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? 'コピー済み' : 'コピー'}
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default Args;
