// ---- Types ----

export type SlideLayout = 'title' | 'section' | 'content' | 'two-col' | 'blank' | 'diagram';

export type DiagramKind =
  | 'venn' | 'matrix4' | 'matrix9' | 'pyramid'
  | 'flowchart' | 'logic-tree' | 'bar-chart' | 'line-chart' | 'image';

export interface VennData       { kind: 'venn'; leftLabel: string; rightLabel: string; overlapLabel: string; leftColor: string; rightColor: string; }
export interface MatrixData     { kind: 'matrix4' | 'matrix9'; xLabel: string; yLabel: string; colHeaders: string[]; rowHeaders: string[]; cells: string[]; }
export interface PyramidData    { kind: 'pyramid'; layers: Array<{ label: string; subLabel: string }>; }
export interface FlowchartData  { kind: 'flowchart'; nodes: Array<{ id: string; label: string; type: 'start' | 'end' | 'process' | 'decision' }>; }
export interface LogicTreeData  { kind: 'logic-tree'; root: string; branches: Array<{ label: string; children: string[] }>; }
export interface BarChartData   { kind: 'bar-chart'; xLabels: string[]; values: number[]; barColor: string; }
export interface LineChartData  { kind: 'line-chart'; xLabels: string[]; series: Array<{ name: string; values: number[] }>; }
export interface ImageData      { kind: 'image'; src: string; }

export type DiagramData = VennData | MatrixData | PyramidData | FlowchartData | LogicTreeData | BarChartData | LineChartData | ImageData;

export interface Slide {
  id: string;
  layout: SlideLayout;
  title: string;
  body: string;       // subtitle（titleレイアウト）/ 本文 / 左カラム
  bodyRight: string;  // 右カラム（two-colのみ）
  diagram?: DiagramData;
}

export interface SlideshowData {
  presentationTitle: string;
  slides: Slide[];
}

export const LAYOUT_CONFIG: Record<SlideLayout, { name: string }> = {
  title:     { name: 'タイトル' },
  section:   { name: 'セクション' },
  content:   { name: 'コンテンツ' },
  'two-col': { name: '2カラム' },
  blank:     { name: '空白' },
  diagram:   { name: 'ダイアグラム' },
};

export const LAYOUTS = Object.keys(LAYOUT_CONFIG) as SlideLayout[];

export const DIAGRAM_KINDS: DiagramKind[] = [
  'venn', 'matrix4', 'matrix9', 'pyramid',
  'flowchart', 'logic-tree', 'bar-chart', 'line-chart', 'image',
];

export const DIAGRAM_KIND_NAMES: Record<DiagramKind, string> = {
  venn:         'ベン図',
  matrix4:      '4マス',
  matrix9:      '9マス',
  pyramid:      'ピラミッド',
  flowchart:    'フロー',
  'logic-tree': 'ロジックツリー',
  'bar-chart':  '棒グラフ',
  'line-chart': '折れ線',
  image:        '画像',
};

export const DEFAULT_DIAGRAMS: Record<DiagramKind, DiagramData> = {
  venn: {
    kind: 'venn',
    leftLabel: '要因A',
    rightLabel: '要因B',
    overlapLabel: '共通',
    leftColor: '#7c3aed',
    rightColor: '#4f46e5',
  },
  matrix4: {
    kind: 'matrix4',
    xLabel: 'X軸',
    yLabel: 'Y軸',
    colHeaders: ['高い', '低い'],
    rowHeaders: ['大きい', '小さい'],
    cells: ['戦略A', '戦略B', '戦略C', '戦略D'],
  },
  matrix9: {
    kind: 'matrix9',
    xLabel: 'X軸',
    yLabel: 'Y軸',
    colHeaders: ['高い', '中', '低い'],
    rowHeaders: ['大きい', '中', '小さい'],
    cells: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'],
  },
  pyramid: {
    kind: 'pyramid',
    layers: [
      { label: 'ビジョン', subLabel: '目指す姿' },
      { label: '戦略', subLabel: '方向性' },
      { label: '実行', subLabel: '施策' },
    ],
  },
  flowchart: {
    kind: 'flowchart',
    nodes: [
      { id: '1', label: '開始', type: 'start' },
      { id: '2', label: '処理A', type: 'process' },
      { id: '3', label: '判断', type: 'decision' },
      { id: '4', label: '終了', type: 'end' },
    ],
  },
  'logic-tree': {
    kind: 'logic-tree',
    root: '目標',
    branches: [
      { label: '要因1', children: ['施策A', '施策B'] },
      { label: '要因2', children: ['施策C', '施策D'] },
    ],
  },
  'bar-chart': {
    kind: 'bar-chart',
    xLabels: ['Q1', 'Q2', 'Q3', 'Q4'],
    values: [40, 65, 50, 80],
    barColor: '#7c3aed',
  },
  'line-chart': {
    kind: 'line-chart',
    xLabels: ['1月', '2月', '3月', '4月', '5月'],
    series: [
      { name: 'シリーズA', values: [30, 45, 40, 60, 55] },
      { name: 'シリーズB', values: [20, 35, 50, 45, 70] },
    ],
  },
  image: {
    kind: 'image',
    src: '',
  },
};

// ---- Slide operations ----

const genId = (): string => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

export const createSlide = (layout: SlideLayout = 'content'): Slide => ({
  id: genId(),
  layout,
  title: '',
  body: '',
  bodyRight: '',
});

export const addSlide = (slides: Slide[], layout: SlideLayout, afterIndex?: number): Slide[] => {
  const s = createSlide(layout);
  if (afterIndex === undefined) return [...slides, s];
  const result = [...slides];
  result.splice(afterIndex + 1, 0, s);
  return result;
};

export const removeSlide = (slides: Slide[], id: string): Slide[] =>
  slides.filter(s => s.id !== id);

export const moveSlide = (slides: Slide[], id: string, direction: 'up' | 'down'): Slide[] => {
  const idx = slides.findIndex(s => s.id === id);
  if (idx === -1) return slides;
  if (direction === 'up' && idx === 0) return slides;
  if (direction === 'down' && idx === slides.length - 1) return slides;
  const result = [...slides];
  const swap = direction === 'up' ? idx - 1 : idx + 1;
  [result[idx], result[swap]] = [result[swap], result[idx]];
  return result;
};

// ---- JSON ----

export const exportJson = (data: SlideshowData): string =>
  JSON.stringify(data, null, 2);

export const importJson = (json: string): SlideshowData | null => {
  try {
    const p = JSON.parse(json) as Record<string, unknown>;
    if (typeof p.presentationTitle !== 'string') return null;
    if (!Array.isArray(p.slides)) return null;
    return {
      presentationTitle: p.presentationTitle,
      slides: (p.slides as Partial<Slide>[]).map(s => ({
        id: typeof s.id === 'string' ? s.id : genId(),
        layout: LAYOUTS.includes(s.layout as SlideLayout) ? (s.layout as SlideLayout) : 'content',
        title: typeof s.title === 'string' ? s.title : '',
        body: typeof s.body === 'string' ? s.body : '',
        bodyRight: typeof s.bodyRight === 'string' ? s.bodyRight : '',
        ...(s.diagram ? { diagram: s.diagram } : {}),
      })),
    };
  } catch {
    return null;
  }
};
