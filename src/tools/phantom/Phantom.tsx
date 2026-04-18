import './Phantom.css';
import { usePhantom } from './usePhantom';
import { useTheme } from '../../context/ThemeContext';

const Phantom = () => {
  const { dark } = useTheme();
  const {
    inputText, setInputText,
    pairs, addPair, updatePair, deletePair,
    rules, addRule, updateRule, deleteRule,
    tab, setTab,
    output,
    handleCopy,
  } = usePhantom();

  return (
    <div className={`ph-root ${dark ? 'dark' : 'light'}`}>
      <header className="ph-header">
        <div>
          <div className="ph-logo">PHANTOM</div>
          <div className="ph-subtitle">text mask &amp; transform engine</div>
        </div>
      </header>

      <div className="ph-main">
        {/* Input panel */}
        <div className="ph-panel">
          <div className="ph-panel-label">INPUT</div>
          <textarea
            className="ph-input"
            placeholder="テキストを入力..."
            value={inputText}
            onChange={e => setInputText(e.target.value)}
          />
        </div>

        {/* Output panel */}
        <div className="ph-panel">
          <div className="ph-panel-label">OUTPUT</div>
          <div className="ph-output-wrap">
            <div className="ph-output">{output}</div>
            <button className="ph-copy-btn" onClick={handleCopy}>
              コピー
            </button>
          </div>
        </div>

        {/* Rules panel */}
        <div className="ph-rules-panel">
          {/* Tabs */}
          <div className="ph-tabs">
            <button
              className={`ph-tab${tab === 'replace' ? ' active' : ''}`}
              onClick={() => setTab('replace')}
            >
              置換
            </button>
            <button
              className={`ph-tab${tab === 'random' ? ' active' : ''}`}
              onClick={() => setTab('random')}
            >
              ランダム
            </button>
          </div>

          {/* Replace pairs */}
          {tab === 'replace' && (
            <>
              {pairs.map(pair => (
                <div className="ph-pair-row" key={pair.id}>
                  <input
                    className="ph-field"
                    placeholder="変換前"
                    value={pair.from}
                    onChange={e => updatePair(pair.id, 'from', e.target.value)}
                  />
                  <span className="ph-arrow">→</span>
                  <input
                    className="ph-field"
                    placeholder="変換後"
                    value={pair.to}
                    onChange={e => updatePair(pair.id, 'to', e.target.value)}
                  />
                  <button
                    className="ph-del-btn"
                    aria-label="ペアを削除"
                    onClick={() => deletePair(pair.id)}
                  >
                    ×
                  </button>
                </div>
              ))}
              <button className="ph-add-btn" onClick={addPair}>
                ＋ ペアを追加
              </button>
            </>
          )}

          {/* Random rules */}
          {tab === 'random' && (
            <>
              <p className="ph-random-hint">
                対象文字を入力すると、同じ文字種（小文字→小文字 / ひらがな→ひらがな など）の別の文字にランダムで置き換えます。
              </p>
              {rules.map(rule => (
                <div className="ph-rule-row" key={rule.id}>
                  <input
                    className="ph-field"
                    placeholder="対象文字列（例: ka3afai）"
                    value={rule.targetStr}
                    onChange={e => updateRule(rule.id, e.target.value)}
                  />
                  <button
                    className="ph-del-btn"
                    aria-label="ルールを削除"
                    onClick={() => deleteRule(rule.id)}
                  >
                    ×
                  </button>
                </div>
              ))}
              <button className="ph-add-btn" onClick={addRule}>
                ＋ ルールを追加
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Phantom;