export interface ErrorRecord {
  id: string;
  title: string;
  errorText: string;
  response: string;
  createdAt: string;
}

const STORAGE_KEY = 'errlog-data';

let _seq = 0;
const newId = () => `el-${Date.now()}-${++_seq}`;

export const loadRecords = (): ErrorRecord[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const saveRecords = (items: ErrorRecord[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch { /* ignore */ }
};

export const createRecord = (
  errorText: string,
  title: string,
  response: string,
): ErrorRecord => ({
  id: newId(),
  title: title.trim() || errorText.slice(0, 60).replace(/\n/g, ' '),
  errorText,
  response,
  createdAt: new Date().toISOString(),
});

export const addRecord = (items: ErrorRecord[], r: ErrorRecord): ErrorRecord[] =>
  [r, ...items];

export const deleteRecord = (items: ErrorRecord[], id: string): ErrorRecord[] =>
  items.filter(r => r.id !== id);

export const filterRecords = (items: ErrorRecord[], query: string): ErrorRecord[] => {
  if (!query.trim()) return items;
  const q = query.toLowerCase();
  return items.filter(
    r =>
      r.title.toLowerCase().includes(q) ||
      r.errorText.toLowerCase().includes(q) ||
      r.response.toLowerCase().includes(q),
  );
};

export const generatePrompt = (errorText: string): string =>
  `以下のエラーを分析し、次の形式で回答してください。

【エラー内容】
${errorText}

---

## 1. エラーフロー
\`\`\`mermaid
flowchart TD
  A[エラー発生] --> B{原因の種類}
  B --> C[根本原因1]
  B --> D[根本原因2]
  C --> E[解決策1]
  D --> F[解決策2]
  E --> G[解決済み ✅]
  F --> G
\`\`\`
※実際のエラー内容に合わせてノードを書き換えてください。

## 2. 原因分析
（根本原因を2〜3行で簡潔に）

## 3. 解決策
解決策ごとにコードブロック付きで記載してください。
\`\`\`bash
# CLIコマンド例
\`\`\`
\`\`\`sql
-- SQLの場合
\`\`\`
\`\`\`typescript
// ソースコードの場合
\`\`\`

## 4. 再発防止策
（1〜2行）`;

// Extract the first ```mermaid ... ``` block from an LLM response
export const extractMermaid = (response: string): string | null => {
  const m = response.match(/```mermaid\s*\n([\s\S]*?)```/);
  return m ? m[1].trim() : null;
};
