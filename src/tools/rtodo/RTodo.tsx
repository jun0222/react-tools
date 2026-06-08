import { useState, useCallback } from 'react';
import { CheckSquare } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import './RTodo.css';

const STORAGE_KEY = 'rtodo-memo';

const FORMAT_EXAMPLE = `(A) 2024-01-15 タスク名 +プロジェクト @コンテキスト
(B) 優先度B のタスク +myproject @work
x 2024-01-14 2024-01-10 完了済みタスク

書式説明:
  (A)-(Z)   優先度（Aが最高）
  YYYY-MM-DD  作成日または完了日
  +project  プロジェクトタグ
  @context  コンテキストタグ
  x         完了済み`;

const buildPrompt = (memo: string): string =>
  `以下の雑なメモを todo.txt フォーマットに変換してください。

【todo.txt フォーマット】
- 優先度: (A)〜(Z) — 最初に置く。省略可
- 完了: 先頭に "x " を付け、完了日・作成日を続ける
- プロジェクト: "+タグ名"（半角スペースで区切る）
- コンテキスト: "@タグ名"（半角スペースで区切る）
- 日付: YYYY-MM-DD 形式

【変換のルール】
- タスクの重要性・緊急性から優先度 (A)〜(C) を推定してください
- 関連するタスクには同じ +project タグを付けてください
- 場所・ツール・状況は @context タグにしてください
- 曖昧な日程は省略、「今日中」などは今日の日付を使用
- 1タスク1行で出力してください

【メモ】
${memo.trim()}

【出力】
todo.txt フォーマットのリストのみを出力してください（説明文不要）。`;

const RTodo = () => {
  const { dark } = useTheme();
  const [memo, setMemo] = useState(() => {
    try { return localStorage.getItem(STORAGE_KEY) ?? ''; } catch { return ''; }
  });
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState('');
  const [showFormat, setShowFormat] = useState(false);

  const save = (v: string) => {
    setMemo(v);
    try { localStorage.setItem(STORAGE_KEY, v); } catch { /* ignore */ }
  };

  const showToast = useCallback((msg: string) => {
    setToast(msg); setTimeout(() => setToast(''), 1800);
  }, []);

  const handleCopy = async () => {
    if (!memo.trim()) return;
    try {
      await navigator.clipboard.writeText(buildPrompt(memo));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      showToast('コピー失敗');
    }
  };

  return (
    <div className={`rtodo-root ${dark ? 'dark' : 'light'}`}>
      <div className="rt-header">
        <div className="rt-logo-icon"><CheckSquare size={22} color="white" /></div>
        <h1><span className="rt-accent">RTodo</span></h1>
        <button className="rt-btn rt-btn-primary" onClick={handleCopy} disabled={!memo.trim()}>
          {copied ? 'コピーしました！' : 'プロンプトをコピー'}
        </button>
      </div>

      <div className="rt-body">
        <div className="rt-panel">
          <div className="rt-panel-title">雑なメモ</div>
          <textarea
            className="rt-textarea"
            placeholder={'箇条書きでもなんでもOK\n\n例:\n- 来週中にAさんに報告書送る（重要）\n- 月曜日のMTG資料作成\n- 買い物：牛乳、卵、パン\n- gitのブランチ整理（今週中）\n- 読書：Clean Code（仕事用）'}
            rows={10}
            value={memo}
            onChange={e => save(e.target.value)}
            spellCheck={false}
          />
          <div className="rt-action-row">
            <button className="rt-btn rt-btn-primary" onClick={handleCopy} disabled={!memo.trim()}>
              {copied ? 'コピーしました！' : 'プロンプトをコピー'}
            </button>
            {memo && (
              <button className="rt-btn rt-btn-ghost" onClick={() => save('')}>リセット</button>
            )}
            <button className="rt-btn rt-btn-ghost" onClick={() => setShowFormat(v => !v)}>
              {showFormat ? '書式を隠す' : '書式を見る'}
            </button>
          </div>
        </div>

        {showFormat && (
          <div className="rt-panel">
            <div className="rt-panel-title">todo.txt 書式</div>
            <div className="rt-format-hint">{FORMAT_EXAMPLE}</div>
          </div>
        )}

        {memo.trim() && (
          <div className="rt-panel">
            <div className="rt-panel-title">生成されるプロンプト（プレビュー）</div>
            <div className="rt-prompt-preview">{buildPrompt(memo)}</div>
          </div>
        )}
      </div>

      {toast && <div className="rt-toast">{toast}</div>}
    </div>
  );
};

export default RTodo;
