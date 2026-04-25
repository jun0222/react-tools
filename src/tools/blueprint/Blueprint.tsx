import { useState, useCallback } from 'react';
import { useTheme } from '../../context/ThemeContext';
import {
  exportToMarkdown, DEFAULT_NFRS, DEFAULT_STRATEGIES,
} from './blueprintCore';
import type { FuncReq, TestCase, NfrItem, StrategyItem, Priority, TestKind } from './blueprintCore';
import './Blueprint.css';

let _id = 0;
const uid = () => `bp-${++_id}-${Date.now()}`;

type Tab = 'func' | 'bbt' | 'nfr' | 'strategy';
const TABS: { id: Tab; label: string }[] = [
  { id: 'func',     label: '機能要件'    },
  { id: 'bbt',      label: 'BBテスト'    },
  { id: 'nfr',      label: '非機能要件'  },
  { id: 'strategy', label: 'テスト戦略'  },
];

const Blueprint = () => {
  const { dark } = useTheme();
  const [tab, setTab] = useState<Tab>('func');
  const [featureName, setFeatureName] = useState('');
  const [description, setDescription] = useState('');
  const [funcReqs, setFuncReqs] = useState<FuncReq[]>([]);
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [nfrs, setNfrs] = useState<NfrItem[]>(DEFAULT_NFRS.map(n => ({ ...n })));
  const [strategies, setStrategies] = useState<StrategyItem[]>(DEFAULT_STRATEGIES.map(s => ({ ...s })));
  const [kindFilter, setKindFilter] = useState<TestKind | 'all'>('all');
  const [toast, setToast] = useState('');

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2000);
  }, []);

  // --- Func Reqs ---
  const addFuncReq = () => setFuncReqs(prev => [...prev, { id: uid(), text: '', priority: 'must' }]);
  const updateFuncReq = (id: string, key: keyof FuncReq, val: string) =>
    setFuncReqs(prev => prev.map(r => r.id === id ? { ...r, [key]: val } : r));
  const removeFuncReq = (id: string) => setFuncReqs(prev => prev.filter(r => r.id !== id));

  // --- Test Cases ---
  const addTestCase = () =>
    setTestCases(prev => [...prev, { id: uid(), name: '', input: '', expected: '', kind: 'normal' }]);
  const updateTestCase = (id: string, key: keyof TestCase, val: string) =>
    setTestCases(prev => prev.map(tc => tc.id === id ? { ...tc, [key]: val } : tc));
  const removeTestCase = (id: string) => setTestCases(prev => prev.filter(tc => tc.id !== id));

  // --- NFR ---
  const toggleNfr = (id: string) =>
    setNfrs(prev => prev.map(n => n.id === id ? { ...n, checked: !n.checked } : n));
  const updateNfrNote = (id: string, note: string) =>
    setNfrs(prev => prev.map(n => n.id === id ? { ...n, note } : n));

  // --- Strategy ---
  const toggleStrategy = (id: string) =>
    setStrategies(prev => prev.map(s => s.id === id ? { ...s, checked: !s.checked } : s));

  // --- Export ---
  const handleExport = async () => {
    const md = exportToMarkdown({ featureName, description, funcReqs, testCases, nfrs, strategies });
    try {
      await navigator.clipboard.writeText(md);
      showToast('Markdown をコピーしました');
    } catch {
      showToast('コピー失敗');
    }
  };

  const visibleCases = kindFilter === 'all'
    ? testCases
    : testCases.filter(tc => tc.kind === kindFilter);

  return (
    <div className={`bp-root ${dark ? 'dark' : 'light'}`}>
      {/* Header */}
      <div className="bp-header">
        <div className="bp-title-area">
          <div className="bp-logo-icon">🗺️</div>
          <h1><span className="accent">Blueprint</span></h1>
        </div>
        <button className="bp-btn bp-btn-blue" onClick={handleExport}>
          Markdown でコピー
        </button>
      </div>

      {/* Feature name */}
      <div className="bp-feature-name">
        <input
          placeholder="機能名を入力…（例: ユーザーログイン機能）"
          value={featureName}
          onChange={e => setFeatureName(e.target.value)}
          aria-label="機能名"
        />
        <textarea
          className="bp-desc-input"
          placeholder="概要・ゴール・対象ユーザーを一言で…"
          value={description}
          onChange={e => setDescription(e.target.value)}
          rows={2}
          aria-label="機能概要"
        />
      </div>

      {/* Tabs */}
      <div className="bp-tabs" role="tablist">
        {TABS.map(t => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            className={`bp-tab ${tab === t.id ? 'bp-tab-active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="bp-panel">
        {/* ===== FUNC REQS ===== */}
        {tab === 'func' && (
          <>
            <p className="bp-panel-hint">
              ユーザーが「何を達成できるか」を中心に書く。実装方法ではなく振る舞いに注目する。
              優先度: <strong>Must</strong> = 必須 / <strong>Should</strong> = できれば / <strong>Could</strong> = あれば嬉しい
            </p>
            <div className="bp-req-list">
              {funcReqs.map(req => (
                <div key={req.id} className="bp-req-row">
                  <select
                    className="bp-req-priority"
                    data-p={req.priority}
                    value={req.priority}
                    onChange={e => updateFuncReq(req.id, 'priority', e.target.value as Priority)}
                    aria-label="優先度"
                  >
                    <option value="must">Must</option>
                    <option value="should">Should</option>
                    <option value="could">Could</option>
                  </select>
                  <input
                    className="bp-req-input"
                    placeholder="〜ができる / 〜が表示される…"
                    value={req.text}
                    onChange={e => updateFuncReq(req.id, 'text', e.target.value)}
                    aria-label="要件テキスト"
                  />
                  <button className="bp-btn bp-btn-danger bp-btn-sm" onClick={() => removeFuncReq(req.id)} aria-label="削除">×</button>
                </div>
              ))}
            </div>
            <button className="bp-btn-add" onClick={addFuncReq}>＋ 要件を追加</button>
          </>
        )}

        {/* ===== BLACK BOX TESTS ===== */}
        {tab === 'bbt' && (
          <>
            <p className="bp-panel-hint">
              実装を知らなくても書けるテストを定義する。入力と期待する出力のペアで考える。<br />
              正常系: 想定どおりの動作 / 異常系: エラー・拒否 / 境界値: 限界値・端数・空
            </p>
            <div className="bp-tc-filter">
              {(['all', 'normal', 'error', 'boundary'] as const).map(k => (
                <button
                  key={k}
                  className={`bp-btn bp-btn-sm ${kindFilter === k ? 'bp-btn-blue' : 'bp-btn-ghost'}`}
                  onClick={() => setKindFilter(k)}
                >
                  {k === 'all' ? 'すべて' : k === 'normal' ? '正常系' : k === 'error' ? '異常系' : '境界値'}
                </button>
              ))}
            </div>
            {visibleCases.length > 0 && (
              <div className="bp-tc-header">
                <span>テスト名</span><span>入力条件</span><span>期待結果</span><span>種別</span><span />
              </div>
            )}
            {visibleCases.map(tc => (
              <div key={tc.id} className="bp-tc-row">
                <input className="bp-tc-input" placeholder="ログイン成功" value={tc.name}
                  onChange={e => updateTestCase(tc.id, 'name', e.target.value)} aria-label="テスト名" />
                <input className="bp-tc-input" placeholder="正常なメール+PW" value={tc.input}
                  onChange={e => updateTestCase(tc.id, 'input', e.target.value)} aria-label="入力条件" />
                <input className="bp-tc-input" placeholder="ダッシュボードへ遷移" value={tc.expected}
                  onChange={e => updateTestCase(tc.id, 'expected', e.target.value)} aria-label="期待結果" />
                <select className="bp-tc-kind" value={tc.kind}
                  onChange={e => updateTestCase(tc.id, 'kind', e.target.value as TestKind)} aria-label="種別">
                  <option value="normal">正常系</option>
                  <option value="error">異常系</option>
                  <option value="boundary">境界値</option>
                </select>
                <button className="bp-btn bp-btn-danger bp-btn-sm" onClick={() => removeTestCase(tc.id)} aria-label="削除">×</button>
              </div>
            ))}
            <button className="bp-btn-add" onClick={addTestCase}>＋ テストケースを追加</button>
          </>
        )}

        {/* ===== NON-FUNCTIONAL REQS ===== */}
        {tab === 'nfr' && (
          <>
            <p className="bp-panel-hint">
              機能以外の品質特性。最初に洗い出して、後から忘れないようにする。
              関係するものにチェックを入れ、具体的な基準をメモしておく。
            </p>
            <div className="bp-nfr-list">
              {nfrs.map(nfr => (
                <div key={nfr.id} className="bp-nfr-row">
                  <div className="bp-nfr-main">
                    <input
                      type="checkbox"
                      className="bp-nfr-check"
                      checked={nfr.checked}
                      onChange={() => toggleNfr(nfr.id)}
                      id={`nfr-${nfr.id}`}
                    />
                    <label className="bp-nfr-label" htmlFor={`nfr-${nfr.id}`}>{nfr.label}</label>
                  </div>
                  {nfr.checked && (
                    <input
                      className="bp-nfr-note"
                      placeholder="具体的な基準・数値・備考…"
                      value={nfr.note}
                      onChange={e => updateNfrNote(nfr.id, e.target.value)}
                    />
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {/* ===== TEST STRATEGY ===== */}
        {tab === 'strategy' && (
          <>
            <p className="bp-panel-hint">
              テストコストを最小化するための意識的な選択。チェックは「実践する」宣言として使う。
            </p>
            <div className="bp-strat-list">
              {strategies.map(s => (
                <div key={s.id} className={`bp-strat-row ${s.checked ? 'checked' : ''}`}>
                  <input
                    type="checkbox"
                    className="bp-nfr-check"
                    checked={s.checked}
                    onChange={() => toggleStrategy(s.id)}
                    id={`strat-${s.id}`}
                  />
                  <label className="bp-strat-label" htmlFor={`strat-${s.id}`}>{s.label}</label>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {toast && <div className="bp-toast">{toast}</div>}
    </div>
  );
};

export default Blueprint;