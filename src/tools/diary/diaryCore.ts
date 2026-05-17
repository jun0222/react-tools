// ---- Mode ----

export type DiaryMode = 'diary' | 'book_memo' | 'research';

export const MODE_CONFIG: Record<DiaryMode, { name: string; txtLabel: string; placeholder: string }> = {
  diary: {
    name: '日記',
    txtLabel: '日  記',
    placeholder: '今日あったことを自由に書いてください。\n句点（。）や改行で自動的に箇条書きに変換されます。',
  },
  book_memo: {
    name: '読書ノート',
    txtLabel: '読書ノート',
    placeholder: '読んだ本の気づき・印象に残ったこと・メモを書いてください。\n句点（。）や改行で自動的に箇条書きに変換されます。',
  },
  research: {
    name: '調査ノート',
    txtLabel: '調査ノート',
    placeholder: '調査した内容・参考情報・気になった点を書いてください。\n句点（。）や改行で自動的に箇条書きに変換されます。',
  },
};

// ---- Bullet conversion ----

const SPLIT_RE = /[。！？\n]|[.!?](?=\s|$)/;

export const toBullets = (text: string): string[] =>
  text
    .split(SPLIT_RE)
    .map(s => s.trim())
    .filter(s => s.length > 0);

export const formatBullets = (bullets: string[]): string =>
  bullets.map(b => `・${b}`).join('\n');

// ---- LLM prompt ----

export const generateLLMPrompt = (bullets: string[]): string => {
  const content = bullets.map(b => `・${b}`).join('\n');
  return `以下の日記を「理科系の作文技術」に則り、要約してください。

【日記本文】
${content}

【要求】
1. 【サマリ】として3〜5文で要約してください。
   原則: 一文一義・主語述語を明確に・冗長な表現なし・受動態より能動態
2. 【キーワード】として重要な概念・出来事・感情を5〜10個、以下の形式で列挙してください（説明は20文字以内）。

必ず以下の形式で出力してください:

【サマリ】
（要約文）

【キーワード】
・キーワード1 — 短い説明（20文字以内）
・キーワード2 — 短い説明（20文字以内）
（以下続く）`;
};

// ---- LLM response parser ----

const extractSection = (text: string, marker: string): string => {
  const start = text.indexOf(marker);
  if (start === -1) return '';
  const after = text.slice(start + marker.length);
  const next = after.search(/【/);
  return (next === -1 ? after : after.slice(0, next)).trim();
};

export interface DiaryKeyword {
  word: string;
  desc: string;
}

const parseKeywordLine = (line: string): DiaryKeyword | null => {
  const clean = line.replace(/^[・\-\*\s]+/, '').trim();
  if (!clean) return null;
  // Split on em-dash variants or colon
  const m = clean.match(/^(.+?)\s*[—–\-]\s*(.+)$/) ||
            clean.match(/^(.+?)\s*[:：]\s*(.+)$/);
  if (m) return { word: m[1].trim(), desc: m[2].trim() };
  return { word: clean, desc: '' };
};

export const parseLLMResponse = (response: string): { summary: string; keywords: DiaryKeyword[] } => {
  const summaryRaw =
    extractSection(response, '【サマリ】') ||
    extractSection(response, '【サマリー】') ||
    extractSection(response, '【要約】');

  const keywordsRaw =
    extractSection(response, '【キーワード】') ||
    extractSection(response, '【キーワードs】');

  const keywords = keywordsRaw
    .split('\n')
    .map(parseKeywordLine)
    .filter((k): k is DiaryKeyword => k !== null);

  return { summary: summaryRaw, keywords };
};

// ---- .txt content (ASCII art format) ----

const SEP_MAJOR = '='.repeat(64);
const SEP_MINOR = '-'.repeat(64);

export const generateTxtContent = (
  dateLabel: string,
  bullets: string[],
  summary: string,
  keywords: DiaryKeyword[],
  mode: DiaryMode = 'diary',
): string => {
  const modeLabel = MODE_CONFIG[mode].txtLabel;
  const bulletLines = bullets.length > 0
    ? bullets.map(b => `  ・${b}`).join('\n')
    : '  （本文なし）';

  const summaryLines = summary
    ? summary.split('\n').map(l => `  ${l}`).join('\n')
    : '  （未入力）';

  const keywordLines = keywords.length > 0
    ? keywords.map(k => k.desc ? `  ・${k.word} — ${k.desc}` : `  ・${k.word}`).join('\n')
    : '  （未入力）';

  const recorded = new Date().toLocaleString('ja-JP', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });

  return [
    SEP_MAJOR,
    `  ${modeLabel}  ${dateLabel}`,
    SEP_MAJOR,
    '',
    '[ 本  文 ]',
    SEP_MINOR,
    '',
    bulletLines,
    '',
    '',
    '[ サ マ リ ]',
    SEP_MINOR,
    '',
    summaryLines,
    '',
    '',
    '[ キーワード ]',
    SEP_MINOR,
    '',
    keywordLines,
    '',
    '',
    SEP_MAJOR,
    `  記録: ${recorded}`,
    SEP_MAJOR,
  ].join('\n');
};

// ---- Utilities ----

export const getDateLabel = (): string => {
  const d = new Date();
  const DAYS = ['日', '月', '火', '水', '木', '金', '土'];
  const y  = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, '0');
  const da = String(d.getDate()).padStart(2, '0');
  const dow = DAYS[d.getDay()];
  return `${y}年${mo}月${da}日（${dow}）`;
};

export const generateFilename = (mode: DiaryMode = 'diary'): string => {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const ts = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}`;
  return `${mode}_${ts}.txt`;
};
