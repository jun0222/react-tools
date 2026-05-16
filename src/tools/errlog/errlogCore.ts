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
