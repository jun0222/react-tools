import { useState, useCallback } from 'react';
import { useTheme } from '../../context/ThemeContext';
import {
  toPascal, toSnake, toCamel, toKebab,
  wrapMdDoc, formatJson, formatSql,
} from './helpers';
import './Forge.css';

const CASES = [
  { label: 'PascalCase', fn: toPascal },
  { label: 'camelCase',  fn: toCamel  },
  { label: 'snake_case', fn: toSnake  },
  { label: 'kebab-case', fn: toKebab  },
] as const;

type Tab = 'case' | 'md' | 'json' | 'sql';

const TABS: { id: Tab; label: string }[] = [
  { id: 'case', label: 'ケース変換' },
  { id: 'md',   label: 'MD 追記'   },
  { id: 'json', label: 'JSON'       },
  { id: 'sql',  label: 'SQL'        },
];

const Forge = () => {
  const { dark } = useTheme();
  const [tab, setTab] = useState<Tab>('case');
  const [caseInput, setCaseInput] = useState('');
  const [mdInput, setMdInput] = useState('');
  const [jsonInput, setJsonInput] = useState('');
  const [jsonOutput, setJsonOutput] = useState<string | null>(null);
  const [sqlInput, setSqlInput] = useState('');
  const [sqlOutput, setSqlOutput] = useState('');
  const [toast, setToast] = useState('');

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 1800);
  }, []);

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast('コピーしました');
    } catch {
      showToast('コピー失敗');
    }
  };

  const mdOutput = mdInput ? wrapMdDoc(mdInput) : '';

  return (
    <div className={`forge ${dark ? 'dark' : 'light'}`}>
      <header className="fg-header">
        <div className="fg-logo-icon">⚒️</div>
        <h1><span className="accent">Forge</span></h1>
      </header>

      {/* ===== TAB BAR ===== */}
      <div className="fg-tabs" role="tablist">
        {TABS.map(t => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            className={`fg-tab ${tab === t.id ? 'fg-tab-active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="fg-panel">
        {/* ===== CASE CONVERTER ===== */}
        {tab === 'case' && (
          <>
            <textarea
              className="fg-textarea"
              placeholder="変換したいテキストを入力…（例: hello world / helloWorld / hello_world）"
              value={caseInput}
              onChange={e => setCaseInput(e.target.value)}
              rows={3}
              aria-label="ケース変換入力"
            />
            <div className="fg-case-grid">
              {CASES.map(({ label, fn }) => {
                const converted = caseInput.trim() ? fn(caseInput) : '';
                return (
                  <div key={label} className="fg-case-row">
                    <span className="fg-case-label">{label}</span>
                    <div className={`fg-case-value${!converted ? ' empty' : ''}`}>
                      {converted || '変換結果がここに表示されます'}
                    </div>
                    <button
                      className="fg-btn fg-btn-ghost fg-btn-copy"
                      onClick={() => copy(converted)}
                      disabled={!converted}
                      aria-label={`${label}をコピー`}
                    >
                      コピー
                    </button>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* ===== MD DOC WRAPPER ===== */}
        {tab === 'md' && (
          <>
            <textarea
              className="fg-textarea"
              placeholder="囲みたいテキストを入力… ## + ``` ``` + --- で自動フォーマットします"
              value={mdInput}
              onChange={e => setMdInput(e.target.value)}
              rows={5}
              aria-label="MDラッパー入力"
            />
            {mdOutput && (
              <>
                <div className="fg-md-output" aria-label="MD変換結果">{mdOutput}</div>
                <div className="fg-md-actions">
                  <button className="fg-btn fg-btn-orange" onClick={() => copy(mdOutput)}>
                    コピー
                  </button>
                </div>
              </>
            )}
          </>
        )}

        {/* ===== JSON FORMATTER ===== */}
        {tab === 'json' && (
          <>
            <textarea
              className="fg-textarea"
              placeholder='{"key":"value"} を貼り付けると整形します'
              value={jsonInput}
              onChange={e => {
                const v = e.target.value;
                setJsonInput(v);
                setJsonOutput(formatJson(v));
              }}
              rows={6}
              aria-label="JSON入力"
            />
            {jsonInput && (
              jsonOutput === null ? (
                <div className="fg-format-error">⚠ 不正な JSON です</div>
              ) : (
                <>
                  <div className="fg-md-output" aria-label="JSON整形結果">{jsonOutput}</div>
                  <div className="fg-md-actions">
                    <button className="fg-btn fg-btn-orange" onClick={() => copy(jsonOutput)}>
                      コピー
                    </button>
                  </div>
                </>
              )
            )}
          </>
        )}

        {/* ===== SQL FORMATTER ===== */}
        {tab === 'sql' && (
          <>
            <textarea
              className="fg-textarea"
              placeholder="SELECT * FROM users WHERE id = 1 を貼り付けると整形します"
              value={sqlInput}
              onChange={e => {
                const v = e.target.value;
                setSqlInput(v);
                setSqlOutput(formatSql(v));
              }}
              rows={6}
              aria-label="SQL入力"
            />
            {sqlOutput && (
              <>
                <div className="fg-md-output" aria-label="SQL整形結果">{sqlOutput}</div>
                <div className="fg-md-actions">
                  <button className="fg-btn fg-btn-orange" onClick={() => copy(sqlOutput)}>
                    コピー
                  </button>
                </div>
              </>
            )}
          </>
        )}
      </div>

      {toast && <div className="fg-toast">{toast}</div>}
    </div>
  );
};

export default Forge;