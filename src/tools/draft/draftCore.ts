// ---- Metrics ----

export const countChars = (text: string): number => text.length;

const SENTENCE_SPLIT_RE = /[。！？]|[!?]|\.(?=\s|$)|\n/;

export const countSentences = (text: string): number => {
  if (!text.trim()) return 0;
  return text
    .split(SENTENCE_SPLIT_RE)
    .map(s => s.trim())
    .filter(s => s.length > 0)
    .length;
};

export const avgSentenceLength = (text: string): number => {
  if (!text.trim()) return 0;
  const parts = text
    .split(SENTENCE_SPLIT_RE)
    .map(s => s.trim())
    .filter(s => s.length > 0);
  if (parts.length === 0) return 0;
  return Math.round(parts.reduce((sum, s) => sum + s.length, 0) / parts.length);
};

export const estimateReadingTimeSec = (text: string): number => {
  if (!text.trim()) return 0;
  return Math.ceil((countChars(text) / 500) * 60);
};

// ---- Chat level ----

export type ChatLevel = 'green' | 'yellow' | 'orange' | 'red' | 'dark-red';

export interface ChatLevelInfo {
  level: ChatLevel;
  label: string;
  suggestion: string;
  emoji: string;
}

export const getChatLevel = (charCount: number): ChatLevelInfo => {
  if (charCount <= 150) return {
    level: 'green',
    label: 'チャット向き',
    suggestion: '短くてテンポよく伝わります。',
    emoji: '💬',
  };
  if (charCount <= 400) return {
    level: 'yellow',
    label: 'チャットでOK',
    suggestion: '問題のない長さです。必要なら箇条書きで整理しましょう。',
    emoji: '💬',
  };
  if (charCount <= 800) return {
    level: 'orange',
    label: '長め — 分割を検討',
    suggestion: '複数のメッセージに分けるか、箇条書きにすると読みやすくなります。',
    emoji: '📝',
  };
  if (charCount <= 1500) return {
    level: 'red',
    label: 'メール / ドキュメント向き',
    suggestion: 'このボリュームはチャットより、メールや共有ドキュメントが適しています。',
    emoji: '📧',
  };
  return {
    level: 'dark-red',
    label: '口頭・文書を推奨',
    suggestion: '量が多すぎます。口頭での説明か、文書化して共有しましょう。',
    emoji: '🎙️',
  };
};

// ---- Sentence length info ----

export interface LevelInfo {
  level: 'green' | 'yellow' | 'red';
  label: string;
}

export const getSentenceLengthInfo = (avg: number): LevelInfo => {
  if (avg === 0) return { level: 'green', label: '—' };
  if (avg <= 15) return { level: 'green', label: '短くて読みやすい' };
  if (avg <= 30) return { level: 'yellow', label: 'やや長め' };
  return { level: 'red', label: '文を短く区切ることを検討' };
};

export const getSentenceCountInfo = (n: number): LevelInfo => {
  if (n <= 3) return { level: 'green', label: '1メッセージで収まる' };
  if (n <= 7) return { level: 'yellow', label: '複数の論点あり' };
  return { level: 'red', label: '論点が多い — 整理が必要' };
};

// ---- Story frameworks ----

export interface FrameworkField {
  key: string;
  label: string;
  placeholder: string;
}

export interface Framework {
  id: string;
  name: string;
  desc: string;
  fields: FrameworkField[];
  generate: (values: Record<string, string>) => string;
}

export const FRAMEWORKS: readonly Framework[] = [
  {
    id: 'prep',
    name: 'PREP',
    desc: '結論 → 理由 → 具体例 → 結論（説得力のある主張）',
    fields: [
      { key: 'point',   label: 'Point  ── 結論・主張',   placeholder: '一番伝えたいことは何か' },
      { key: 'reason',  label: 'Reason ── 理由',         placeholder: 'なぜそう言えるか' },
      { key: 'example', label: 'Example ── 具体例・根拠', placeholder: '具体的な例・数字・事実' },
      { key: 'repoint', label: 'Point  ── 結論を再度',   placeholder: '最後にまとめて強調' },
    ],
    generate: v => [
      v.point,
      v.reason   && `理由は、${v.reason}`,
      v.example  && `例えば、${v.example}`,
      v.repoint  && `改めて、${v.repoint}`,
    ].filter(Boolean).join('\n'),
  },
  {
    id: 'star',
    name: 'STAR',
    desc: '状況 → 課題 → 行動 → 結果（経緯の説明・報告）',
    fields: [
      { key: 'situation', label: 'Situation ── 状況・背景', placeholder: 'いつ・どんな状況だったか' },
      { key: 'task',      label: 'Task ── 課題・目標',      placeholder: 'やるべきこと・求められたこと' },
      { key: 'action',    label: 'Action ── 行動',          placeholder: '実際にしたこと' },
      { key: 'result',    label: 'Result ── 結果・成果',    placeholder: '何が変わったか・学んだこと' },
    ],
    generate: v => [v.situation, v.task, v.action, v.result].filter(Boolean).join('\n'),
  },
  {
    id: 'pyramid',
    name: 'ピラミッド原則',
    desc: '主張 → 複数の根拠（トップダウン論理）',
    fields: [
      { key: 'claim',   label: '主張 ── メインメッセージ', placeholder: '結論を一文で' },
      { key: 'reason1', label: '根拠 ①',                  placeholder: '理由・証拠 1' },
      { key: 'reason2', label: '根拠 ②',                  placeholder: '理由・証拠 2' },
      { key: 'reason3', label: '根拠 ③（任意）',           placeholder: '理由・証拠 3' },
    ],
    generate: v => [
      v.claim,
      v.reason1 && `・${v.reason1}`,
      v.reason2 && `・${v.reason2}`,
      v.reason3 && `・${v.reason3}`,
    ].filter(Boolean).join('\n'),
  },
  {
    id: 'pcs',
    name: '問題 → 原因 → 解決',
    desc: '問題定義 → 原因分析 → 解決策の提案',
    fields: [
      { key: 'problem',  label: '問題 ── 何が起きているか', placeholder: '現象・困っていること' },
      { key: 'cause',    label: '原因 ── なぜ起きているか', placeholder: '根本原因・背景' },
      { key: 'solution', label: '解決策 ── どうするか',      placeholder: '具体的なアクション・提案' },
    ],
    generate: v => [
      v.problem  && `【問題】${v.problem}`,
      v.cause    && `【原因】${v.cause}`,
      v.solution && `【解決策】${v.solution}`,
    ].filter(Boolean).join('\n'),
  },
  {
    id: 'kishotenketsu',
    name: '起承転結',
    desc: '導入 → 展開 → 転換 → 結論（物語・説明型）',
    fields: [
      { key: 'ki',    label: '起 ── 導入・きっかけ', placeholder: '話の背景・なぜ今この話をするか' },
      { key: 'sho',   label: '承 ── 展開・詳細',     placeholder: '詳しい説明・根拠' },
      { key: 'ten',   label: '転 ── 転換・気づき',   placeholder: '視点の転換・対比・意外性' },
      { key: 'ketsu', label: '結 ── 結論・まとめ',   placeholder: '最終的に伝えたいこと' },
    ],
    generate: v => [v.ki, v.sho, v.ten, v.ketsu].filter(Boolean).join('\n'),
  },
];

// ---- Mindmap default template ----

export const DEFAULT_MINDMAP = `mindmap
  root((テーマ))
    論点A
      根拠・詳細
      根拠・詳細
    論点B
      根拠・詳細
    論点C
      根拠・詳細`;