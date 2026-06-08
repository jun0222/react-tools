import { useState, useCallback } from 'react';
import { FlaskConical } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import './TestData.css';

const STORAGE_KEY = 'testdata-sets';

interface TestDataSet {
  id: string;
  theme: string;
  data: string;
  savedAt: string;
}

const load = (): TestDataSet[] => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]'); }
  catch { return []; }
};

const save = (sets: TestDataSet[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sets));
};

const buildPrompt = (theme: string): string =>
  `「${theme}」に関するテストデータを生成してください。

【条件】
- 10件程度のJSONデータを生成すること
- フィールド構成はテーマに合わせて自由に設計してよい
- リアルで多様なデータにすること（単調なデータは不可）
- 必ず以下のコードブロック形式で出力すること（コピーしやすくするため）

\`\`\`json
[
  { ... },
  ...
]
\`\`\`

コードブロック以外の説明文は不要です。`;

const extractJson = (text: string): string => {
  const m = text.match(/```(?:json)?\s*\n([\s\S]*?)```/);
  if (m) return m[1].trim();
  const arr = text.match(/\[\s*\{[\s\S]*\}\s*\]/);
  return arr ? arr[0].trim() : text.trim();
};

let _seq = 0;
const uid = () => `td-${Date.now()}-${++_seq}`;

const TestData = () => {
  const { dark } = useTheme();
  const [sets, setSets] = useState<TestDataSet[]>(load);
  const [theme, setTheme] = useState('');
  const [paste, setPaste] = useState('');
  const [toast, setToast] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg); setTimeout(() => setToast(''), 1800);
  }, []);

  const copyPrompt = async () => {
    if (!theme.trim()) { showToast('テーマを入力してください'); return; }
    try {
      await navigator.clipboard.writeText(buildPrompt(theme.trim()));
      showToast('プロンプトをコピーしました');
    } catch { showToast('コピー失敗'); }
  };

  const saveData = () => {
    if (!theme.trim() || !paste.trim()) { showToast('テーマとデータを入力してください'); return; }
    const json = extractJson(paste);
    const set: TestDataSet = { id: uid(), theme: theme.trim(), data: json, savedAt: new Date().toISOString() };
    const next = [set, ...sets];
    setSets(next);
    save(next);
    setPaste('');
    setTheme('');
    showToast('保存しました');
  };

  const removeSet = (id: string) => {
    const next = sets.filter(s => s.id !== id);
    setSets(next);
    save(next);
    showToast('削除しました');
  };

  const copyData = async (data: string) => {
    try { await navigator.clipboard.writeText(data); showToast('データをコピーしました'); }
    catch { showToast('コピー失敗'); }
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return `${d.getFullYear()}/${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getDate()).padStart(2,'0')}`;
  };

  return (
    <div className={`td-root ${dark ? 'dark' : 'light'}`}>
      <div className="td-header">
        <div className="td-logo-icon"><FlaskConical size={20} color="white" /></div>
        <h1><span className="td-accent">TestData</span> テストデータ生成</h1>
      </div>

      {/* Step 1: Theme & prompt */}
      <div className="td-panel">
        <div className="td-step-label">Step 1 — テーマを入力してプロンプトをコピー</div>
        <div className="td-step-row">
          <input
            className="td-input"
            placeholder="例: ECサイトの商品データ、ユーザーアカウント、タスク管理..."
            value={theme}
            onChange={e => setTheme(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && copyPrompt()}
          />
          <button className="td-btn td-btn-primary" onClick={copyPrompt} disabled={!theme.trim()}>
            プロンプトをコピー
          </button>
        </div>
        <div className="td-hint">LLMにプロンプトを貼り付けてテストデータを生成させてください</div>
      </div>

      {/* Step 2: Paste LLM output */}
      <div className="td-panel">
        <div className="td-step-label">Step 2 — LLMの出力を貼り付けて保存</div>
        <textarea
          className="td-textarea"
          rows={8}
          placeholder="LLMが出力したJSONをここに貼り付けてください（コードブロックごとでも可）"
          value={paste}
          onChange={e => setPaste(e.target.value)}
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button className="td-btn td-btn-primary" onClick={saveData} disabled={!paste.trim() || !theme.trim()}>
            保存
          </button>
        </div>
      </div>

      {/* Saved sets */}
      {sets.length > 0 && (
        <div className="td-saved">
          <div className="td-saved-title">保存済み ({sets.length})</div>
          {sets.map(set => (
            <div key={set.id} className="td-set-card">
              <div className="td-set-header">
                <div className="td-set-theme">{set.theme}</div>
                <div className="td-set-date">{formatDate(set.savedAt)}</div>
                <div className="td-set-actions">
                  <button className="td-btn td-btn-ghost td-btn-sm" onClick={() => copyData(set.data)}>コピー</button>
                  <button className="td-btn td-btn-ghost td-btn-sm" onClick={() => setExpandedId(expandedId === set.id ? null : set.id)}>
                    {expandedId === set.id ? '閉じる' : '表示'}
                  </button>
                  <button className="td-btn td-btn-ghost td-btn-sm" onClick={() => removeSet(set.id)}>削除</button>
                </div>
              </div>
              {expandedId === set.id && (
                <pre className="td-set-data">{set.data}</pre>
              )}
            </div>
          ))}
        </div>
      )}

      {toast && <div className="td-toast">{toast}</div>}
    </div>
  );
};

export default TestData;
