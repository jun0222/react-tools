// ---- Types ----

export type SlideLayout = 'title' | 'section' | 'content' | 'two-col' | 'blank';

export interface Slide {
  id: string;
  layout: SlideLayout;
  title: string;
  body: string;       // subtitle（titleレイアウト）/ 本文 / 左カラム
  bodyRight: string;  // 右カラム（two-colのみ）
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
      })),
    };
  } catch {
    return null;
  }
};
