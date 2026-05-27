// ---- Types ----

export type SlideLayout = 'title' | 'section' | 'content' | 'two-col' | 'blank';

export interface Slide {
  id: string;
  layout: SlideLayout;
  title: string;
  body: string;
  bodyRight: string;
}

export interface SlideshowData {
  presentationTitle: string;
  slides: Slide[];
}

export const LAYOUT_CONFIG: Record<SlideLayout, { name: string; label: string }> = {
  title:     { name: 'タイトル',   label: 'title' },
  section:   { name: 'セクション', label: 'section' },
  content:   { name: 'コンテンツ', label: 'content' },
  'two-col': { name: '2カラム',    label: 'two-col' },
  blank:     { name: '空白',       label: 'blank' },
};

export const LAYOUTS = Object.keys(LAYOUT_CONFIG) as SlideLayout[];

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

// ---- ASCII art ----

const IW = 60; // inner width
const BORDER = '+' + '='.repeat(IW) + '+';

const padRow = (text: string): string => '|' + text.slice(0, IW).padEnd(IW) + '|';
const emptyRow = (): string => '|' + ' '.repeat(IW) + '|';

const centerRow = (text: string): string => {
  const t = text.slice(0, IW - 2);
  const lp = Math.floor((IW - t.length) / 2);
  const rp = IW - t.length - lp;
  return '|' + ' '.repeat(lp) + t + ' '.repeat(rp) + '|';
};

const indentRow = (text: string): string => padRow('  ' + text);

export const generateAsciiSlide = (slide: Slide, index: number, total: number): string => {
  const num = `${index + 1} / ${total}`;
  const tag = `[${LAYOUT_CONFIG[slide.layout].label}]`;
  const left = `  ${num}`;
  const right = `${tag}  `;
  const mid = Math.max(0, IW - left.length - right.length);
  const header = '|' + left + ' '.repeat(mid) + right + '|';

  const { layout, title, body, bodyRight } = slide;
  const lines: string[] = [BORDER, header, BORDER];

  if (layout === 'title') {
    const t = title || '（タイトル未入力）';
    const b = body || '（サブタイトル未入力）';
    lines.push(emptyRow(), centerRow(t), centerRow('-'.repeat(Math.min(t.length + 4, IW - 4))), centerRow(b), emptyRow());
  } else if (layout === 'section') {
    const t = title || '（セクション名未入力）';
    lines.push(emptyRow(), centerRow('-'.repeat(36)), centerRow(t), centerRow('-'.repeat(36)), emptyRow());
  } else if (layout === 'content') {
    lines.push(indentRow(title || '（タイトル未入力）'), indentRow('-'.repeat(IW - 4)));
    const bodyLines = body ? body.split('\n').filter(l => l.trim()) : ['（本文未入力）'];
    bodyLines.forEach(l => lines.push(indentRow(l)));
  } else if (layout === 'two-col') {
    lines.push(indentRow(title || '（タイトル未入力）'), indentRow('-'.repeat(IW - 4)));
    const colW = 26;
    const leftLines  = body      ? body.split('\n').filter(l => l.trim())      : ['（左カラム未入力）'];
    const rightLines = bodyRight ? bodyRight.split('\n').filter(l => l.trim()) : ['（右カラム未入力）'];
    const maxRows = Math.max(leftLines.length, rightLines.length);
    for (let i = 0; i < maxRows; i++) {
      const l = (leftLines[i] ?? '').slice(0, colW).padEnd(colW);
      const r = (rightLines[i] ?? '').slice(0, colW);
      lines.push(padRow(`  ${l} | ${r}`));
    }
  } else {
    lines.push(emptyRow(), emptyRow(), emptyRow());
  }

  lines.push(BORDER);
  return lines.join('\n');
};

export const generateAsciiPresentation = (data: SlideshowData): string => {
  const title = data.presentationTitle || '（タイトル未入力）';
  const header = [
    BORDER,
    padRow(`  プレゼンテーション: ${title}`),
    padRow(`  スライド数: ${data.slides.length}`),
    BORDER,
  ].join('\n');

  if (data.slides.length === 0) {
    return header + '\n' + padRow('  （スライドなし）') + '\n' + BORDER;
  }

  return header + '\n\n' +
    data.slides.map((s, i) => generateAsciiSlide(s, i, data.slides.length)).join('\n\n');
};

// ---- JSON export / import ----

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
      })),
    };
  } catch {
    return null;
  }
};
