// --- Types ---
export interface Reply {
  id: string;
  text: string;
  createdAt: number;
  resolved: boolean;
}

export interface PromptEntry {
  id: string;
  body: string;
  replies: Reply[];
  sent: boolean;
  createdAt: number;
  updatedAt: number;
  trashedAt?: number;
}


// --- ロゴ生成用ヘルパー ---
const words = [
  'Zero', 'One', 'Two', 'Three', 'Four', 'Five',
  'Six', 'Seven', 'Eight', 'Nine', 'Ten',
];

export const getShotTitle = (count: number): string => {
  if (count <= 10) return words[count];
  return `${count}`;
};

// --- LocalStorage ---
const STORAGE_KEY = 'oneshot-prompts';

export const loadPrompts = (): PromptEntry[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const savePrompts = (prompts: PromptEntry[]): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prompts));
};

// --- ID生成 ---
export const uid = (): string =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

// --- エクスポート ---
export const exportPrompts = (prompts: PromptEntry[]): void => {
  const blob = new Blob([JSON.stringify(prompts, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `oneshot-prompts-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
};

// --- インポートバリデーション ---
export const findDuplicateIds = (
  incoming: PromptEntry[],
  existing: PromptEntry[],
): string[] => {
  const existingIds = new Set(existing.map(p => p.id));
  return incoming.map(p => p.id).filter(id => existingIds.has(id));
};

// --- インポート ---
export const importPrompts = (): Promise<PromptEntry[]> =>
  new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return reject(new Error('No file'));
      const reader = new FileReader();
      reader.onload = () => {
        try {
          resolve(JSON.parse(reader.result as string));
        } catch {
          reject(new Error('Invalid JSON'));
        }
      };
      reader.readAsText(file);
    };
    input.click();
  });

// --- 全プロンプト蒸留コピー ---
export const buildGlobalDistillPrompt = (prompts: PromptEntry[]): string => {
  const promptList = prompts
    .map(
      (p, i) =>
        `### Prompt ${i + 1}\n${p.body}${
          p.replies.length
            ? '\n\n**Replies:**\n' +
              p.replies.map((r) => `- ${r.resolved ? '[RESOLVED] ' : ''}${r.text}`).join('\n')
            : ''
        }`
    )
    .join('\n\n---\n\n');

  return `# プロンプト改善・蒸留リクエスト

以下は私が使っているプロンプト一覧（${prompts.length}件）です。
これらを分析して改善・蒸留のアドバイスをください。

## 分析観点（以下を埋めてください）

- **重複パターン**: ___
- **曖昧な指示**: ___
- **不足している制約**: ___
- **統合可能なプロンプト**: ___
- **効果的な言い換え**: ___
- **蒸留後のテンプレート案**: ___

---

${promptList}
`;
};

// --- クリップボード ---
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
};