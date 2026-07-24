export interface BoxDef {
  id: string;
  x: number;
  y: number;
  label: string;
  bg: string;
  fg: string;
  desc: string;
}

export const BOXES: readonly BoxDef[] = [
  {
    id: 'b1', x: 50, y: 8,
    label: 'Keter ケテル',
    bg: '#f5f5f0', fg: '#1a1a1a',
    desc: '全ての始まり。神性の源であり、無限の光（アイン・ソフ・オール）を象徴する。',
  },
  {
    id: 'b2', x: 22, y: 24,
    label: 'Binah ビナー',
    bg: '#1f2937', fg: '#ffffff',
    desc: '形を与える受容の力。母性原理と深い理解を象徴する。',
  },
  {
    id: 'b3', x: 78, y: 24,
    label: 'Chokmah コクマー',
    bg: '#6b7280', fg: '#ffffff',
    desc: '純粋な創造エネルギーと直感。父性原理を象徴する。',
  },
  {
    id: 'b4', x: 22, y: 42,
    label: 'Gevurah ゲブラー',
    bg: '#dc2626', fg: '#ffffff',
    desc: '規律・制限・正義の力。必要な区別と裁きを象徴する。',
  },
  {
    id: 'b5', x: 78, y: 42,
    label: 'Chesed ケセド',
    bg: '#2563eb', fg: '#ffffff',
    desc: '無条件の愛と寛容。拡大していく慈悲の力を象徴する。',
  },
  {
    id: 'b6', x: 50, y: 54,
    label: 'Tiferet ティファレト',
    bg: '#eab308', fg: '#1a1a1a',
    desc: '慈悲と峻厳を調和させる中心。美と均衡を象徴する。',
  },
  {
    id: 'b7', x: 22, y: 66,
    label: 'Hod ホド',
    bg: '#ea580c', fg: '#ffffff',
    desc: '知性・論理・コミュニケーションの力を象徴する。',
  },
  {
    id: 'b8', x: 78, y: 66,
    label: 'Netzach ネツァク',
    bg: '#16a34a', fg: '#ffffff',
    desc: '感情・欲望・忍耐。芸術的な創造力を象徴する。',
  },
  {
    id: 'b9', x: 50, y: 82,
    label: 'Yesod イェソド',
    bg: '#7c3aed', fg: '#ffffff',
    desc: '潜在意識と月。上位の力を現実へつなぐ基礎を象徴する。',
  },
  {
    id: 'b10', x: 50, y: 96,
    label: 'Malkuth マルクト',
    bg: '#92400e', fg: '#ffffff',
    desc: '物質世界そのもの。現実として顕現した状態を象徴する。',
  },
];

export interface ConnDef {
  from: string;
  to: string;
  arrow: boolean;
}

export const CONNECTIONS: readonly ConnDef[] = [
  { from: 'b1', to: 'b2', arrow: false },
  { from: 'b1', to: 'b3', arrow: false },
  { from: 'b2', to: 'b3', arrow: true },
  { from: 'b2', to: 'b4', arrow: false },
  { from: 'b3', to: 'b5', arrow: false },
  { from: 'b4', to: 'b5', arrow: true },
  { from: 'b4', to: 'b6', arrow: false },
  { from: 'b5', to: 'b6', arrow: false },
  { from: 'b4', to: 'b7', arrow: false },
  { from: 'b5', to: 'b8', arrow: false },
  { from: 'b7', to: 'b8', arrow: true },
  { from: 'b7', to: 'b9', arrow: false },
  { from: 'b8', to: 'b9', arrow: false },
  { from: 'b9', to: 'b10', arrow: false },
];

export type BoxTexts = Record<string, string>;

export const MIN_CH = 12;

// 'ch' 単位は半角文字基準のため、全角文字（日本語など）は2倍の幅として数える
const isFullWidth = (code: number): boolean =>
  (code >= 0x3000 && code <= 0x30ff) || // CJK記号・句読点、ひらがな、カタカナ
  (code >= 0x3400 && code <= 0x9fff) || // CJK統合漢字（拡張A含む）
  (code >= 0xf900 && code <= 0xfaff) || // CJK互換漢字
  (code >= 0xff00 && code <= 0xffef); // 全角形

const charWidth = (ch: string): number => (isFullWidth(ch.codePointAt(0) ?? 0) ? 2 : 1);

const lineWidth = (line: string): number =>
  Array.from(line).reduce((sum, ch) => sum + charWidth(ch), 0);

export const boxWidthCh = (text: string): number => {
  const longestLine = Math.max(...text.split('\n').map(lineWidth));
  return Math.max(MIN_CH, longestLine + 2);
};

export const boxRows = (text: string): number => text.split('\n').length;

export const emptyTexts = (): BoxTexts =>
  Object.fromEntries(BOXES.map(b => [b.id, '']));

export const exportJson = (texts: BoxTexts): string => JSON.stringify(texts, null, 2);

export const importJson = (json: string): BoxTexts | null => {
  try {
    const data: unknown = JSON.parse(json);
    if (typeof data !== 'object' || data === null || Array.isArray(data)) return null;

    const result = emptyTexts();
    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      if (key in result && typeof value === 'string') result[key] = value;
    }
    return result;
  } catch {
    return null;
  }
};

export const arrowHeadPoints = (
  from: Pick<BoxDef, 'x' | 'y'>,
  to: Pick<BoxDef, 'x' | 'y'>,
  inset: number,
  headLen: number,
  headWidth: number,
): string => {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const dist = Math.hypot(dx, dy) || 1;
  const ux = dx / dist;
  const uy = dy / dist;

  const tipX = to.x - ux * inset;
  const tipY = to.y - uy * inset;
  const baseX = tipX - ux * headLen;
  const baseY = tipY - uy * headLen;
  const px = -uy;
  const py = ux;

  return [
    `${tipX},${tipY}`,
    `${baseX + px * headWidth},${baseY + py * headWidth}`,
    `${baseX - px * headWidth},${baseY - py * headWidth}`,
  ].join(' ');
};

export const tickForConnection = (
  from: Pick<BoxDef, 'x' | 'y'>,
  to: Pick<BoxDef, 'x' | 'y'>,
  len: number,
): { x1: number; y1: number; x2: number; y2: number } => {
  const mx = (from.x + to.x) / 2;
  const my = (from.y + to.y) / 2;
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const dist = Math.hypot(dx, dy) || 1;
  const px = -dy / dist;
  const py = dx / dist;
  return { x1: mx - px * len, y1: my - py * len, x2: mx + px * len, y2: my + py * len };
};