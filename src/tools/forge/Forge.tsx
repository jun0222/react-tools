import { useState, useCallback } from 'react';
import { useTheme } from '../../context/ThemeContext';
import {
  toPascal, toSnake, toCamel, toKebab,
  wrapMdDoc, formatJson, formatSql, toOneLiner,
  normalizeSpaces, toBulletList, addMdLineBreaks,
} from './helpers';
import './Forge.css';

const CASES = [
  { label: 'PascalCase', fn: toPascal },
  { label: 'camelCase',  fn: toCamel  },
  { label: 'snake_case', fn: toSnake  },
  { label: 'kebab-case', fn: toKebab  },
] as const;

type Tab = 'case' | 'md' | 'json' | 'sql' | 'normalize' | 'bullet' | 'oneliner' | 'mdsp';

const TABS: { id: Tab; label: string }[] = [
  { id: 'case',      label: 'ケース変換'   },
  { id: 'md',        label: 'MD 追記'     },
  { id: 'json',      label: 'JSON'         },
  { id: 'sql',       label: 'SQL'          },
  { id: 'normalize', label: 'スペース整形'  },
  { id: 'bullet',    label: '箇条書き'     },
  { id: 'oneliner',  label: 'ワンライナー'  },
  { id: 'mdsp',      label: 'MD 末尾SP'   },
];

type BulletStyle = '- [ ]' | '-' | '・';
const BULLET_OPTIONS: { label: string; value: BulletStyle }[] = [
  { label: '- [ ]', value: '- [ ]' },
  { label: '-',     value: '-'     },
  { label: '・',    value: '・'    },
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
  const [onelinerInput, setOnelinerInput] = useState('');
  const [normalizeInput, setNormalizeInput] = useState('');
  const [bulletInput, setBulletInput] = useState('');
  const [bulletStyle, setBulletStyle] = useState<BulletStyle>('- [ ]');
  const [mdspInput, setMdspInput] = useState('');
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
        {/* ===== NORMALIZE SPACES ===== */}
        {tab === 'normalize' && (
          <>
            <textarea
              className="fg-textarea"
              placeholder={'改行を維持しつつ、行内の余分なスペース・タブ・全角スペースを整形します\n\nhello   world\n　foo　　bar'}
              value={normalizeInput}
              onChange={e => setNormalizeInput(e.target.value)}
              rows={6}
              aria-label="スペース整形入力"
            />
            {normalizeInput.trim() && (
              <>
                <div className="fg-md-output" aria-label="スペース整形結果">
                  {normalizeSpaces(normalizeInput)}
                </div>
                <div className="fg-md-actions">
                  <button
                    className="fg-btn fg-btn-orange"
                    onClick={() => copy(normalizeSpaces(normalizeInput))}
                  >
                    コピー
                  </button>
                </div>
              </>
            )}
          </>
        )}

        {/* ===== BULLET LIST ===== */}
        {tab === 'bullet' && (
          <>
            <div className="fg-bullet-selector">
              {BULLET_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  className={`fg-btn ${bulletStyle === opt.value ? 'fg-btn-orange' : 'fg-btn-ghost'}`}
                  onClick={() => setBulletStyle(opt.value)}
                  aria-pressed={bulletStyle === opt.value}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <textarea
              className="fg-textarea"
              placeholder={'各行の先頭に選択した記号を付けてコピーします\n行頭のスペース・全角スペースは維持されます\n\n  インデントもそのまま'}
              value={bulletInput}
              onChange={e => setBulletInput(e.target.value)}
              rows={6}
              aria-label="箇条書き入力"
            />
            {bulletInput.trim() && (
              <>
                <div className="fg-md-output" aria-label="箇条書き結果">
                  {toBulletList(bulletInput, bulletStyle)}
                </div>
                <div className="fg-md-actions">
                  <button
                    className="fg-btn fg-btn-orange"
                    onClick={() => copy(toBulletList(bulletInput, bulletStyle))}
                  >
                    コピー
                  </button>
                </div>
              </>
            )}
          </>
        )}

        {/* ===== MD 末尾スペース ===== */}
        {tab === 'mdsp' && (
          <>
            <textarea
              className="fg-textarea"
              placeholder={'各行末尾に半角スペース2つを付けて Markdown の改行を保持します\n\nこの行は\nこの行と結合されません'}
              value={mdspInput}
              onChange={e => setMdspInput(e.target.value)}
              rows={6}
              aria-label="MD末尾スペース入力"
            />
            {mdspInput.trim() && (
              <>
                <div className="fg-md-output" aria-label="MD末尾スペース結果">
                  {addMdLineBreaks(mdspInput)}
                </div>
                <div className="fg-md-actions">
                  <button
                    className="fg-btn fg-btn-orange"
                    onClick={() => copy(addMdLineBreaks(mdspInput))}
                  >
                    コピー
                  </button>
                </div>
              </>
            )}
          </>
        )}

        {/* ===== ONE-LINER ===== */}
        {tab === 'oneliner' && (
          <>
            <textarea
              className="fg-textarea"
              placeholder={'改行・タブ・スペースをまとめて半角スペース1つにします\n\nSELECT\n  id, name\nFROM users'}
              value={onelinerInput}
              onChange={e => setOnelinerInput(e.target.value)}
              rows={6}
              aria-label="ワンライナー入力"
            />
            {onelinerInput.trim() && (
              <>
                <div className="fg-md-output" aria-label="ワンライナー結果">
                  {toOneLiner(onelinerInput)}
                </div>
                <div className="fg-md-actions">
                  <button
                    className="fg-btn fg-btn-orange"
                    onClick={() => copy(toOneLiner(onelinerInput))}
                  >
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