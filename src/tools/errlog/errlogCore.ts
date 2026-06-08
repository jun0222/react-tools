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

const MERMAID_START = /^(flowchart|graph\s+[A-Z]+|sequenceDiagram|classDiagram|stateDiagram(-v2)?|erDiagram|gantt|pie(\s+title)?|gitGraph|mindmap|journey|quadrantChart|timeline|xychart)/i;

// Extract the first mermaid block from an LLM response.
// Handles: ```mermaid ... ```, ``` ... ``` where content starts with mermaid keyword,
// and raw mermaid content without code fences.
export const extractMermaid = (response: string): string | null => {
  const m = response.match(/```mermaid\s*\n([\s\S]*?)```/);
  if (m) return m[1].trim();

  for (const block of response.matchAll(/```[^\n]*\n([\s\S]*?)```/g)) {
    const inner = block[1].trim();
    if (MERMAID_START.test(inner)) return inner;
  }

  const lines = response.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (!MERMAID_START.test(lines[i].trim())) continue;
    const collected: string[] = [];
    for (let j = i; j < lines.length; j++) {
      if (collected.length > 2 && lines[j].startsWith('#')) break;
      if (collected.length > 0 && lines[j] === '' && lines[j - 1] === '') break;
      collected.push(lines[j]);
    }
    const result = collected.join('\n').trim();
    if (result) return result;
  }
  return null;
};

export const generateFilename = (): string => {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `errlog-${d.getFullYear()}_${pad(d.getMonth() + 1)}_${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}_${pad(d.getSeconds())}.md`;
};

export const generateMarkdown = (
  title: string,
  errorText: string,
  response: string,
): string => {
  const displayTitle = title.trim() || errorText.slice(0, 60).replace(/\n/g, ' ');
  const now = new Date().toISOString();
  return `# ${displayTitle}

## エラー内容

\`\`\`
${errorText}
\`\`\`

## LLM の返答

${response}

---

*記録日時: ${now}*
`;
};
