import { describe, it, expect } from 'vitest';
import {
  createSlide,
  addSlide,
  removeSlide,
  moveSlide,
  generateAsciiSlide,
  generateAsciiPresentation,
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

const makeSlide = (id: string, layout: Slide['layout'] = 'content'): Slide =>
  ({ id, layout, title: '', body: '', bodyRight: '' });

describe('addSlide', () => {
  it('afterIndex未指定で末尾に追加される', () => {
    const slides = [makeSlide('a'), makeSlide('b')];
    const result = addSlide(slides, 'content');
    expect(result.length).toBe(3);
    expect(result[2].layout).toBe('content');
  });

  it('afterIndex指定でその後ろに挿入される', () => {
    const slides = [makeSlide('a'), makeSlide('b'), makeSlide('c')];
    const result = addSlide(slides, 'title', 1);
    expect(result.length).toBe(4);
    expect(result[2].layout).toBe('title');
    expect(result[1].id).toBe('b');
    expect(result[3].id).toBe('c');
  });

  it('afterIndex=0で先頭の後ろに挿入', () => {
    const slides = [makeSlide('a'), makeSlide('b')];
    const result = addSlide(slides, 'section', 0);
    expect(result[1].layout).toBe('section');
    expect(result[0].id).toBe('a');
    expect(result[2].id).toBe('b');
  });

  it('元の配列を変更しない', () => {
    const slides = [makeSlide('a')];
    addSlide(slides, 'content');
    expect(slides.length).toBe(1);
  });

  it('空配列に追加できる', () => {
    const result = addSlide([], 'title');
    expect(result.length).toBe(1);
    expect(result[0].layout).toBe('title');
  });
});

// ---- removeSlide ----

describe('removeSlide', () => {
  it('指定idのスライドが削除される', () => {
    const slides = [makeSlide('a'), makeSlide('b'), makeSlide('c')];
    const result = removeSlide(slides, 'b');
    expect(result.length).toBe(2);
    expect(result.map(s => s.id)).toEqual(['a', 'c']);
  });

  it('存在しないidの場合は変わらない', () => {
    const slides = [makeSlide('a'), makeSlide('b')];
    const result = removeSlide(slides, 'z');
    expect(result.length).toBe(2);
  });

  it('元の配列を変更しない', () => {
    const slides = [makeSlide('a'), makeSlide('b')];
    removeSlide(slides, 'a');
    expect(slides.length).toBe(2);
  });
});

// ---- moveSlide ----

describe('moveSlide', () => {
  it('upで前の要素と入れ替わる', () => {
    const slides = [makeSlide('a'), makeSlide('b'), makeSlide('c')];
    const result = moveSlide(slides, 'b', 'up');
    expect(result.map(s => s.id)).toEqual(['b', 'a', 'c']);
  });

  it('downで次の要素と入れ替わる', () => {
    const slides = [makeSlide('a'), makeSlide('b'), makeSlide('c')];
    const result = moveSlide(slides, 'b', 'down');
    expect(result.map(s => s.id)).toEqual(['a', 'c', 'b']);
  });

  it('先頭要素のupはno-op', () => {
    const slides = [makeSlide('a'), makeSlide('b')];
    const result = moveSlide(slides, 'a', 'up');
    expect(result.map(s => s.id)).toEqual(['a', 'b']);
  });

  it('末尾要素のdownはno-op', () => {
    const slides = [makeSlide('a'), makeSlide('b')];
    const result = moveSlide(slides, 'b', 'down');
    expect(result.map(s => s.id)).toEqual(['a', 'b']);
  });

  it('存在しないidはno-op', () => {
    const slides = [makeSlide('a'), makeSlide('b')];
    const result = moveSlide(slides, 'z', 'up');
    expect(result.map(s => s.id)).toEqual(['a', 'b']);
  });

  it('元の配列を変更しない', () => {
    const slides = [makeSlide('a'), makeSlide('b')];
    moveSlide(slides, 'b', 'up');
    expect(slides[0].id).toBe('a');
  });
});

// ---- generateAsciiSlide ----

const slide = (overrides: Partial<Slide> = {}): Slide => ({
  id: 'test-id',
  layout: 'content',
  title: '',
  body: '',
  bodyRight: '',
  ...overrides,
});

describe('generateAsciiSlide', () => {
  it('スライド番号と合計数が含まれる', () => {
    const txt = generateAsciiSlide(slide(), 0, 5);
    expect(txt).toContain('1 / 5');
  });

  it('レイアウトラベルが含まれる', () => {
    const txt = generateAsciiSlide(slide({ layout: 'title' }), 0, 3);
    expect(txt).toContain('[title]');
  });

  it('=区切りが含まれる', () => {
    const txt = generateAsciiSlide(slide(), 0, 1);
    expect(txt).toContain('===');
  });

  it('titleレイアウト: タイトルが含まれる', () => {
    const txt = generateAsciiSlide(slide({ layout: 'title', title: 'My Pres', body: 'Subtitle' }), 0, 1);
    expect(txt).toContain('My Pres');
    expect(txt).toContain('Subtitle');
  });

  it('sectionレイアウト: セクション名が含まれる', () => {
    const txt = generateAsciiSlide(slide({ layout: 'section', title: 'Chapter 1' }), 0, 1);
    expect(txt).toContain('Chapter 1');
  });

  it('contentレイアウト: タイトルと本文が含まれる', () => {
    const txt = generateAsciiSlide(slide({ layout: 'content', title: 'Intro', body: '・Point A\n・Point B' }), 0, 1);
    expect(txt).toContain('Intro');
    expect(txt).toContain('・Point A');
    expect(txt).toContain('・Point B');
  });

  it('two-colレイアウト: 左右カラムが含まれる', () => {
    const txt = generateAsciiSlide(
      slide({ layout: 'two-col', title: 'Compare', body: '左側', bodyRight: '右側' }),
      0, 1
    );
    expect(txt).toContain('Compare');
    expect(txt).toContain('左側');
    expect(txt).toContain('右側');
  });

  it('two-colレイアウト: | 区切りが含まれる', () => {
    const txt = generateAsciiSlide(
      slide({ layout: 'two-col', title: 'T', body: 'L', bodyRight: 'R' }),
      0, 1
    );
    expect(txt).toContain('|');
  });

  it('blankレイアウト: タイトルとbodyが含まれない', () => {
    const txt = generateAsciiSlide(slide({ layout: 'blank', title: '', body: '' }), 0, 1);
    expect(txt).toContain('[blank]');
  });

  it('未入力のtitleはプレースホルダーが出る', () => {
    const txt = generateAsciiSlide(slide({ layout: 'content', title: '' }), 0, 1);
    expect(txt).toContain('未入力');
  });
});

// ---- generateAsciiPresentation ----

describe('generateAsciiPresentation', () => {
  const data: SlideshowData = {
    presentationTitle: 'My Deck',
    slides: [
      slide({ layout: 'title', title: 'Welcome' }),
      slide({ layout: 'content', title: 'Points' }),
    ],
  };

  it('プレゼンテーションタイトルが含まれる', () => {
    const txt = generateAsciiPresentation(data);
    expect(txt).toContain('My Deck');
  });

  it('スライド数が含まれる', () => {
    const txt = generateAsciiPresentation(data);
    expect(txt).toContain('2');
  });

  it('全スライドの内容が含まれる', () => {
    const txt = generateAsciiPresentation(data);
    expect(txt).toContain('Welcome');
    expect(txt).toContain('Points');
  });

  it('スライドなしの場合はその旨が表示される', () => {
    const txt = generateAsciiPresentation({ presentationTitle: '', slides: [] });
    expect(txt).toContain('スライドなし');
  });
});

// ---- exportJson / importJson ----

describe('exportJson', () => {
  it('有効なJSONを返す', () => {
    const data: SlideshowData = { presentationTitle: 'Test', slides: [] };
    expect(() => JSON.parse(exportJson(data))).not.toThrow();
  });

  it('presentationTitleとslidesを含む', () => {
    const data: SlideshowData = { presentationTitle: 'Deck', slides: [slide()] };
    const parsed = JSON.parse(exportJson(data));
    expect(parsed.presentationTitle).toBe('Deck');
    expect(Array.isArray(parsed.slides)).toBe(true);
  });
});

describe('importJson', () => {
  it('正しいJSONからSlideshowDataを復元する', () => {
    const data: SlideshowData = {
      presentationTitle: 'Test',
      slides: [slide({ layout: 'title', title: 'T1' })],
    };
    const result = importJson(exportJson(data));
    expect(result).not.toBeNull();
    expect(result!.presentationTitle).toBe('Test');
    expect(result!.slides[0].title).toBe('T1');
  });

  it('不正なJSONはnullを返す', () => {
    expect(importJson('not json')).toBeNull();
  });

  it('presentationTitleがないとnullを返す', () => {
    expect(importJson(JSON.stringify({ slides: [] }))).toBeNull();
  });

  it('slidesがないとnullを返す', () => {
    expect(importJson(JSON.stringify({ presentationTitle: 'x' }))).toBeNull();
  });

  it('不正なレイアウト値はcontentにフォールバック', () => {
    const json = JSON.stringify({
      presentationTitle: 'X',
      slides: [{ id: '1', layout: 'unknown', title: '', body: '', bodyRight: '' }],
    });
    const result = importJson(json);
    expect(result).not.toBeNull();
    expect(result!.slides[0].layout).toBe('content');
  });

  it('idがなければ自動生成される', () => {
    const json = JSON.stringify({
      presentationTitle: 'X',
      slides: [{ layout: 'content', title: '', body: '', bodyRight: '' }],
    });
    const result = importJson(json);
    expect(result).not.toBeNull();
    expect(typeof result!.slides[0].id).toBe('string');
    expect(result!.slides[0].id.length).toBeGreaterThan(0);
  });

  it('round-trip: export→importで元データと同じ', () => {
    const data: SlideshowData = {
      presentationTitle: 'Round Trip',
      slides: [
        slide({ layout: 'title', title: 'T', body: 'Sub' }),
        slide({ layout: 'two-col', title: 'C', body: 'L', bodyRight: 'R' }),
      ],
    };
    const result = importJson(exportJson(data));
    expect(result).not.toBeNull();
    expect(result!.presentationTitle).toBe(data.presentationTitle);
    expect(result!.slides.length).toBe(2);
    expect(result!.slides[0].layout).toBe('title');
    expect(result!.slides[1].bodyRight).toBe('R');
  });
});

// ---- LAYOUT_CONFIG / LAYOUTS ----

describe('LAYOUT_CONFIG', () => {
  it('title・section・content・two-col・blankの5種類が存在する', () => {
    expect(LAYOUT_CONFIG.title).toBeDefined();
    expect(LAYOUT_CONFIG.section).toBeDefined();
    expect(LAYOUT_CONFIG.content).toBeDefined();
    expect(LAYOUT_CONFIG['two-col']).toBeDefined();
    expect(LAYOUT_CONFIG.blank).toBeDefined();
  });

  it('各レイアウトにnameとlabelが存在する', () => {
    for (const cfg of Object.values(LAYOUT_CONFIG)) {
      expect(cfg.name).toBeTruthy();
      expect(cfg.label).toBeTruthy();
    }
  });
});

describe('LAYOUTS', () => {
  it('5要素の配列', () => {
    expect(LAYOUTS.length).toBe(5);
  });
});
