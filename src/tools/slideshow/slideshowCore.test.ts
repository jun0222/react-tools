import { describe, it, expect } from 'vitest';
import {
  createSlide,
  addSlide,
  removeSlide,
  moveSlide,
  exportJson,
  importJson,
  LAYOUT_CONFIG,
  LAYOUTS,
  type Slide,
  type SlideshowData,
} from './slideshowCore';

// ---- createSlide ----

describe('createSlide', () => {
  it('デフォルトレイアウトはcontent', () => {
    expect(createSlide().layout).toBe('content');
  });

  it('指定したレイアウトが設定される', () => {
    expect(createSlide('title').layout).toBe('title');
    expect(createSlide('section').layout).toBe('section');
    expect(createSlide('two-col').layout).toBe('two-col');
    expect(createSlide('blank').layout).toBe('blank');
  });

  it('idが生成される', () => {
    const s = createSlide();
    expect(typeof s.id).toBe('string');
    expect(s.id.length).toBeGreaterThan(0);
  });

  it('2回呼ぶとidが異なる', () => {
    expect(createSlide().id).not.toBe(createSlide().id);
  });

  it('title・body・bodyRightは空文字', () => {
    const s = createSlide();
    expect(s.title).toBe('');
    expect(s.body).toBe('');
    expect(s.bodyRight).toBe('');
  });
});

// ---- addSlide ----

const mk = (id: string, layout: Slide['layout'] = 'content'): Slide =>
  ({ id, layout, title: '', body: '', bodyRight: '' });

describe('addSlide', () => {
  it('afterIndex未指定で末尾に追加', () => {
    const result = addSlide([mk('a'), mk('b')], 'content');
    expect(result.length).toBe(3);
    expect(result[2].layout).toBe('content');
  });

  it('afterIndex指定でその後ろに挿入', () => {
    const result = addSlide([mk('a'), mk('b'), mk('c')], 'title', 1);
    expect(result.length).toBe(4);
    expect(result[2].layout).toBe('title');
    expect(result[1].id).toBe('b');
    expect(result[3].id).toBe('c');
  });

  it('空配列に追加できる', () => {
    const result = addSlide([], 'title');
    expect(result.length).toBe(1);
  });

  it('元の配列を変更しない', () => {
    const slides = [mk('a')];
    addSlide(slides, 'content');
    expect(slides.length).toBe(1);
  });
});

// ---- removeSlide ----

describe('removeSlide', () => {
  it('指定idのスライドが削除される', () => {
    const result = removeSlide([mk('a'), mk('b'), mk('c')], 'b');
    expect(result.map(s => s.id)).toEqual(['a', 'c']);
  });

  it('存在しないidは変わらない', () => {
    expect(removeSlide([mk('a'), mk('b')], 'z').length).toBe(2);
  });

  it('元の配列を変更しない', () => {
    const slides = [mk('a'), mk('b')];
    removeSlide(slides, 'a');
    expect(slides.length).toBe(2);
  });
});

// ---- moveSlide ----

describe('moveSlide', () => {
  it('upで前の要素と入れ替わる', () => {
    const result = moveSlide([mk('a'), mk('b'), mk('c')], 'b', 'up');
    expect(result.map(s => s.id)).toEqual(['b', 'a', 'c']);
  });

  it('downで次の要素と入れ替わる', () => {
    const result = moveSlide([mk('a'), mk('b'), mk('c')], 'b', 'down');
    expect(result.map(s => s.id)).toEqual(['a', 'c', 'b']);
  });

  it('先頭のupはno-op', () => {
    expect(moveSlide([mk('a'), mk('b')], 'a', 'up').map(s => s.id)).toEqual(['a', 'b']);
  });

  it('末尾のdownはno-op', () => {
    expect(moveSlide([mk('a'), mk('b')], 'b', 'down').map(s => s.id)).toEqual(['a', 'b']);
  });

  it('存在しないidはno-op', () => {
    expect(moveSlide([mk('a'), mk('b')], 'z', 'up').map(s => s.id)).toEqual(['a', 'b']);
  });

  it('元の配列を変更しない', () => {
    const slides = [mk('a'), mk('b')];
    moveSlide(slides, 'b', 'up');
    expect(slides[0].id).toBe('a');
  });
});

// ---- exportJson / importJson ----

describe('exportJson', () => {
  it('有効なJSONを返す', () => {
    expect(() => JSON.parse(exportJson({ presentationTitle: 'T', slides: [] }))).not.toThrow();
  });

  it('presentationTitleとslidesを含む', () => {
    const parsed = JSON.parse(exportJson({ presentationTitle: 'Deck', slides: [mk('a')] }));
    expect(parsed.presentationTitle).toBe('Deck');
    expect(Array.isArray(parsed.slides)).toBe(true);
  });
});

describe('importJson', () => {
  it('正しいJSONからSlideshowDataを復元する', () => {
    const data: SlideshowData = {
      presentationTitle: 'Test',
      slides: [{ id: 'x', layout: 'title', title: 'T1', body: 'sub', bodyRight: '' }],
    };
    const result = importJson(exportJson(data));
    expect(result).not.toBeNull();
    expect(result!.presentationTitle).toBe('Test');
    expect(result!.slides[0].title).toBe('T1');
  });

  it('不正なJSONはnullを返す', () => {
    expect(importJson('not json')).toBeNull();
  });

  it('presentationTitleがないとnull', () => {
    expect(importJson(JSON.stringify({ slides: [] }))).toBeNull();
  });

  it('slidesがないとnull', () => {
    expect(importJson(JSON.stringify({ presentationTitle: 'x' }))).toBeNull();
  });

  it('不正なレイアウト値はcontentにフォールバック', () => {
    const json = JSON.stringify({
      presentationTitle: 'X',
      slides: [{ id: '1', layout: 'unknown', title: '', body: '', bodyRight: '' }],
    });
    const result = importJson(json);
    expect(result!.slides[0].layout).toBe('content');
  });

  it('idがなければ自動生成', () => {
    const json = JSON.stringify({
      presentationTitle: 'X',
      slides: [{ layout: 'content', title: '', body: '', bodyRight: '' }],
    });
    const result = importJson(json);
    expect(typeof result!.slides[0].id).toBe('string');
    expect(result!.slides[0].id.length).toBeGreaterThan(0);
  });

  it('round-trip', () => {
    const data: SlideshowData = {
      presentationTitle: 'RT',
      slides: [
        { id: 'a', layout: 'title', title: 'T', body: 'S', bodyRight: '' },
        { id: 'b', layout: 'two-col', title: 'C', body: 'L', bodyRight: 'R' },
      ],
    };
    const result = importJson(exportJson(data));
    expect(result!.presentationTitle).toBe('RT');
    expect(result!.slides[1].bodyRight).toBe('R');
  });
});

// ---- LAYOUT_CONFIG / LAYOUTS ----

describe('LAYOUT_CONFIG', () => {
  it('5種類が存在する', () => {
    expect(Object.keys(LAYOUT_CONFIG)).toHaveLength(5);
    expect(LAYOUT_CONFIG.title).toBeDefined();
    expect(LAYOUT_CONFIG['two-col']).toBeDefined();
  });

  it('各レイアウトにnameが存在する', () => {
    for (const cfg of Object.values(LAYOUT_CONFIG)) {
      expect(cfg.name).toBeTruthy();
    }
  });
});

describe('LAYOUTS', () => {
  it('5要素の配列', () => {
    expect(LAYOUTS.length).toBe(5);
  });
});
