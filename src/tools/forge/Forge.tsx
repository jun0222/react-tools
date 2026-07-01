import { useState, useCallback, useEffect, useRef } from 'react';
import { Hammer } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import {
  toPascal, toSnake, toCamel, toKebab,
  wrapMdDoc, wrapMdBullet, formatJson, formatSql, toOneLiner,
  normalizeSpaces, toBulletList, addMdLineBreaks, deleteChars, listToOneLiner,
  applyReplaces, addSlackSuffix, wrapAtChars, toMdLink,
} from './helpers';
import './Forge.css';

const CASES = [
  { label: 'PascalCase', fn: toPascal },
  { label: 'camelCase',  fn: toCamel  },
  { label: 'snake_case', fn: toSnake  },
  { label: 'kebab-case', fn: toKebab  },
] as const;

type Tab = 'case' | 'md' | 'json' | 'sql' | 'normalize' | 'bullet' | 'oneliner' | 'mdsp' | 'delete' | 'listjoin' | 'replace' | 'slackurl' | 'linebreak' | 'mdlink';

const TABS: { id: Tab; label: string }[] = [
  { id: 'case',      label: 'ケース変換'   },
  { id: 'md',        label: 'MD 追記'     },
  { id: 'mdlink',    label: 'MDリンク'    },
  { id: 'json',      label: 'JSON'         },
  { id: 'sql',       label: 'SQL'          },
  { id: 'normalize', label: 'スペース整形'  },
  { id: 'bullet',    label: '箇条書き'     },
  { id: 'oneliner',  label: 'ワンライナー'  },
  { id: 'mdsp',      label: 'MD 末尾SP'   },
  { id: 'delete',    label: '文字削除'     },
  { id: 'listjoin',  label: 'リスト→1行'  },
  { id: 'replace',   label: '文字置換'     },
  { id: 'slackurl',  label: 'Slack URL'   },
  { id: 'linebreak', label: '改行挿入'     },
];

let _delId = 0;
const delUid = () => `del-${++_delId}`;

let _rpId = 0;
const rpUid = () => `rp-${++_rpId}`;

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
  const [mdTitle, setMdTitle] = useState('');
  const [mdMode, setMdMode] = useState<'code' | 'bullet'>('code');
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
  const [deleteInput, setDeleteInput] = useState('');
  const [listjoinInput, setListjoinInput] = useState('');
  const [replaceInput, setReplaceInput] = useState('');
  const [slackInput, setSlackInput] = useState('');
  const [linebreakInput, setLinebreakInput] = useState('');
  const [linebreakN, setLinebreakN] = useState('30');
  const [mdlinkInput, setMdlinkInput] = useState('');
  const [replacePairs, setReplacePairs] = useState<{ id: string; from: string; to: string }[]>([
    { id: rpUid(), from: '', to: '' },
  ]);
  const [deleteTargets, setDeleteTargets] = useState<{ id: string; value: string }[]>([
    { id: delUid(), value: '' },
  ]);
  const [toast, setToast] = useState('');

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 1800);
  }, []);

  const mdOutput = mdInput
    ? mdMode === 'bullet' ? wrapMdBullet(mdInput, mdTitle) : wrapMdDoc(mdInput, mdTitle)
    : '';

  const replaceOutput = applyReplaces(replaceInput, replacePairs.map(p => ({ from: p.from, to: p.to })));

  const currentOutput = (() => {
    switch (tab) {
      case 'md':        return mdOutput;
      case 'json':      return jsonOutput ?? '';
      case 'sql':       return sqlOutput;
      case 'normalize': return normalizeSpaces(normalizeInput);
      case 'bullet':    return toBulletList(bulletInput, bulletStyle);
      case 'oneliner':  return toOneLiner(onelinerInput);
      case 'mdsp':      return addMdLineBreaks(mdspInput);
      case 'delete':    return deleteChars(deleteInput, deleteTargets.map(t => t.value));
      case 'listjoin':  return listToOneLiner(listjoinInput);
      case 'replace':   return replaceOutput;
      case 'slackurl':  return addSlackSuffix(slackInput);
      case 'mdlink':    return toMdLink(mdlinkInput);
      default:          return '';
    }
  })();

  const currentOutputRef = useRef(currentOutput);
  useEffect(() => { currentOutputRef.current = currentOutput; }, [currentOutput]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        const text = currentOutputRef.current;
        if (!text) return;
        navigator.clipboard.writeText(text).then(
          () => showToast('コピーしました'),
          () => showToast('コピー失敗'),
        );
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [showToast]);

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast('コピーしました');
    } catch {
      showToast('コピー失敗');
    }
  };

  return (
    <div className={`forge ${dark ? 'dark' : 'light'}`}>
      <header className="fg-header">
        <div className="fg-logo-icon"><Hammer size={22} color="white" /></div>
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
            <div className="fg-md-mode">
              {(['code', 'bullet'] as const).map(m => (
                <button
                  key={m}
                  className={`fg-btn ${mdMode === m ? 'fg-btn-orange' : 'fg-btn-ghost'}`}
                  onClick={() => setMdMode(m)}
                  aria-pressed={mdMode === m}
                >
                  {m === 'code' ? 'コードブロック' : '箇条書き'}
                </button>
              ))}
            </div>
            <input
              className="fg-md-title-input"
              type="text"
              placeholder="タイトル（## の後に入ります）"
              value={mdTitle}
              onChange={e => setMdTitle(e.target.value)}
              aria-label="MDタイトル入力"
            />
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
        {/* ===== DELETE CHARS ===== */}
        {tab === 'delete' && (
          <>
            <textarea
              className="fg-textarea"
              placeholder={'削除対象の文字・文字列を下のフィールドに入力し、ここにテキストを貼り付けます'}
              value={deleteInput}
              onChange={e => setDeleteInput(e.target.value)}
              rows={6}
              aria-label="文字削除入力"
            />
            <div className="fg-delete-targets">
              {deleteTargets.map((t, i) => (
                <div key={t.id} className="fg-delete-target-row">
                  <input
                    className="fg-delete-target-input"
                    type="text"
                    placeholder={`削除したい文字 ${i + 1}`}
                    value={t.value}
                    onChange={e => {
                      const v = e.target.value;
                      setDeleteTargets(prev => prev.map(x => x.id === t.id ? { ...x, value: v } : x));
                    }}
                    aria-label={`削除対象 ${i + 1}`}
                  />
                  <button
                    className="fg-btn fg-btn-ghost fg-delete-remove"
                    onClick={() => setDeleteTargets(prev => prev.filter(x => x.id !== t.id))}
                    disabled={deleteTargets.length === 1}
                    aria-label="削除対象を除去"
                  >
                    ✕
                  </button>
                </div>
              ))}
              <button
                className="fg-btn fg-btn-ghost"
                onClick={() => setDeleteTargets(prev => [...prev, { id: delUid(), value: '' }])}
              >
                ＋ 追加
              </button>
            </div>
            {deleteInput.trim() && (
              <>
                <div className="fg-md-output" aria-label="文字削除結果">
                  {deleteChars(deleteInput, deleteTargets.map(t => t.value))}
                </div>
                <div className="fg-md-actions">
                  <button
                    className="fg-btn fg-btn-orange"
                    onClick={() => copy(deleteChars(deleteInput, deleteTargets.map(t => t.value)))}
                  >
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

        {/* ===== LIST JOIN ===== */}
        {tab === 'listjoin' && (
          <>
            <textarea
              className="fg-textarea"
              placeholder={'- [ ] タスクA\n- [ ] タスクB\n1. 手順1\n2. 手順2\n・メモ\n\n→ プレフィックスを除去してスペース区切り1行に'}
              value={listjoinInput}
              onChange={e => setListjoinInput(e.target.value)}
              rows={7}
              aria-label="リスト→1行入力"
            />
            {listjoinInput.trim() && (
              <>
                <div className="fg-md-output" aria-label="リスト1行化結果">
                  {listToOneLiner(listjoinInput)}
                </div>
                <div className="fg-md-actions">
                  <button
                    className="fg-btn fg-btn-orange"
                    onClick={() => copy(listToOneLiner(listjoinInput))}
                  >
                    コピー
                  </button>
                </div>
              </>
            )}
          </>
        )}

        {/* ===== REPLACE ===== */}
        {tab === 'replace' && (
          <>
            <textarea
              className="fg-textarea"
              placeholder={'置換対象のテキストを入力し、下の対応表で変換ルールを指定します'}
              value={replaceInput}
              onChange={e => setReplaceInput(e.target.value)}
              rows={6}
              aria-label="文字置換入力"
            />
            <div className="fg-delete-targets">
              {replacePairs.map((p, i) => (
                <div key={p.id} className="fg-delete-target-row">
                  <input
                    className="fg-delete-target-input"
                    type="text"
                    placeholder={`変換前 ${i + 1}`}
                    value={p.from}
                    onChange={e => setReplacePairs(prev => prev.map(x => x.id === p.id ? { ...x, from: e.target.value } : x))}
                    aria-label={`変換前 ${i + 1}`}
                  />
                  <span className="ph-arrow" style={{ padding: '0 4px', color: 'var(--fg-text-dim)' }}>→</span>
                  <input
                    className="fg-delete-target-input"
                    type="text"
                    placeholder={`変換後 ${i + 1}`}
                    value={p.to}
                    onChange={e => setReplacePairs(prev => prev.map(x => x.id === p.id ? { ...x, to: e.target.value } : x))}
                    aria-label={`変換後 ${i + 1}`}
                  />
                  <button
                    className="fg-btn fg-btn-ghost fg-delete-remove"
                    onClick={() => setReplacePairs(prev => prev.filter(x => x.id !== p.id))}
                    disabled={replacePairs.length === 1}
                    aria-label="置換ルールを除去"
                  >
                    ✕
                  </button>
                </div>
              ))}
              <button
                className="fg-btn fg-btn-ghost"
                onClick={() => setReplacePairs(prev => [...prev, { id: rpUid(), from: '', to: '' }])}
              >
                ＋ 追加
              </button>
            </div>
            {replaceInput.trim() && (
              <>
                <div className="fg-md-output" aria-label="文字置換結果">{replaceOutput}</div>
                <div className="fg-md-actions">
                  <button className="fg-btn fg-btn-orange" onClick={() => copy(replaceOutput)}>
                    コピー
                  </button>
                </div>
              </>
            )}
          </>
        )}

        {/* ===== SLACK URL ===== */}
        {tab === 'slackurl' && (
          <>
            <textarea
              className="fg-textarea"
              placeholder={'URLを1行ずつ入力すると、末尾に半角スペース＋全角スペースを付けてコピーできます。\nSlack がリンクプレビュー（unfurl）を展開するのを防ぎます。\n\nhttp://localhost:5173/\nhttps://example.com/path?q=1'}
              value={slackInput}
              onChange={e => setSlackInput(e.target.value)}
              rows={6}
              aria-label="Slack URL入力"
            />
            {slackInput.trim() && (
              <>
                <div className="fg-md-output" aria-label="Slack URL結果">
                  {addSlackSuffix(slackInput)}
                </div>
                <div className="fg-md-actions">
                  <button
                    className="fg-btn fg-btn-orange"
                    onClick={() => copy(addSlackSuffix(slackInput))}
                  >
                    コピー
                  </button>
                </div>
              </>
            )}
          </>
        )}

        {/* ===== 改行挿入 ===== */}
        {tab === 'linebreak' && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 13, color: 'var(--fg-text-dim)', whiteSpace: 'nowrap' }}>N文字ごとに改行</span>
              <input
                type="number"
                min="1"
                value={linebreakN}
                onChange={e => setLinebreakN(e.target.value)}
                style={{ width: 70, padding: '4px 8px', borderRadius: 6, border: '1px solid var(--fg-border)', background: 'var(--fg-surface2)', color: 'var(--fg-text)', fontSize: 13, outline: 'none' }}
                aria-label="改行を挿入する文字数"
              />
            </div>
            <textarea
              className="fg-textarea"
              placeholder={'長い1行のテキストをN文字ごとに改行します\n\nここに長い文章を入力してください...'}
              value={linebreakInput}
              onChange={e => setLinebreakInput(e.target.value)}
              rows={6}
              aria-label="改行挿入入力"
            />
            {linebreakInput.trim() && (() => {
              const n = parseInt(linebreakN, 10);
              const result = wrapAtChars(linebreakInput, n);
              return (
                <>
                  <div className="fg-md-output" aria-label="改行挿入結果">
                    {result}
                  </div>
                  <div className="fg-md-actions">
                    <button className="fg-btn fg-btn-orange" onClick={() => copy(result)}>
                      コピー
                    </button>
                  </div>
                </>
              );
            })()}
          </>
        )}

        {/* ===== MD リンク ===== */}
        {tab === 'mdlink' && (
          <>
            <textarea
              className="fg-textarea"
              placeholder={'1行目: リンクテキスト\n2行目: URL\n\nhoge\nhttps://example.com'}
              value={mdlinkInput}
              onChange={e => setMdlinkInput(e.target.value)}
              rows={4}
              aria-label="MDリンク入力"
            />
            {toMdLink(mdlinkInput) && (
              <>
                <div className="fg-md-output" aria-label="MDリンク結果">
                  {toMdLink(mdlinkInput)}
                </div>
                <div className="fg-md-actions">
                  <button
                    className="fg-btn fg-btn-orange"
                    onClick={() => copy(toMdLink(mdlinkInput))}
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