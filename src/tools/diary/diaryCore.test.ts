import { describe, it, expect } from 'vitest';
import {
  toBullets,
  formatBullets,
  generateLLMPrompt,
  parseLLMResponse,
  generateTxtContent,
  generateFilename,
  MODE_CONFIG,
} from './diaryCore';

// ---- toBullets ----

describe('toBullets', () => {
  it('空文字は空配列', () => {
    expect(toBullets('')).toEqual([]);
  });

  it('空白のみは空配列', () => {
    expect(toBullets('   ')).toEqual([]);
  });

  it('句点（。）で分割', () => {
    const result = toBullets('今日は晴れた。散歩に行った。');
    expect(result).toEqual(['今日は晴れた', '散歩に行った']);
  });

  it('感嘆符（！）で分割', () => {
    const result = toBullets('楽しかった！最高！');
    expect(result).toEqual(['楽しかった', '最高']);
  });

  it('疑問符（？）で分割', () => {
    const result = toBullets('明日は何する？また散歩？');
    expect(result).toEqual(['明日は何する', 'また散歩']);
  });

  it('改行で分割', () => {
    const result = toBullets('今日は晴れた\n散歩に行った');
    expect(result).toEqual(['今日は晴れた', '散歩に行った']);
  });

  it('複数の区切り文字が混在', () => {
    const result = toBullets('晴れた。散歩した！\n疲れた。');
    expect(result.length).toBe(3); // ！と\nが連続するため空セグメントは除去される
  });

  it('連続した区切りは空アイテムを生まない', () => {
    const result = toBullets('A。\n\nB。');
    expect(result).not.toContain('');
    expect(result.every(s => s.length > 0)).toBe(true);
  });

  it('前後の空白はトリムされる', () => {
    const result = toBullets('  今日は晴れた  。');
    expect(result[0]).toBe('今日は晴れた');
  });
});

// ---- formatBullets ----

describe('formatBullets', () => {
  it('空配列は空文字', () => {
    expect(formatBullets([])).toBe('');
  });

  it('各要素に・が付く', () => {
    const result = formatBullets(['A', 'B']);
    expect(result).toBe('・A\n・B');
  });

  it('1要素は改行なし', () => {
    expect(formatBullets(['テスト'])).toBe('・テスト');
  });
});

// ---- generateLLMPrompt ----

describe('generateLLMPrompt', () => {
  it('日記本文が含まれる', () => {
    const prompt = generateLLMPrompt(['今日は晴れた', '散歩した']);
    expect(prompt).toContain('今日は晴れた');
    expect(prompt).toContain('散歩した');
  });

  it('理科系の作文技術への言及が含まれる', () => {
    const prompt = generateLLMPrompt(['test']);
    expect(prompt).toContain('理科系の作文技術');
  });

  it('【サマリ】の出力指示が含まれる', () => {
    const prompt = generateLLMPrompt(['test']);
    expect(prompt).toContain('【サマリ】');
  });

  it('【キーワード】の出力指示が含まれる', () => {
    const prompt = generateLLMPrompt(['test']);
    expect(prompt).toContain('【キーワード】');
  });

  it('各bullet に・が付く', () => {
    const prompt = generateLLMPrompt(['晴れ', '散歩']);
    expect(prompt).toContain('・晴れ');
    expect(prompt).toContain('・散歩');
  });
});

// ---- parseLLMResponse ----

const SAMPLE_RESPONSE = `【サマリ】
今日は天気がよく充実した一日だった。散歩で体を動かし、読書で知識を深めた。

【キーワード】
・天気 — 朝から快晴で気持ちよかった
・散歩 — 30分ほど近所を歩いた
・読書 — 夜に技術書を読んだ`;

describe('parseLLMResponse', () => {
  it('サマリが抽出される', () => {
    const { summary } = parseLLMResponse(SAMPLE_RESPONSE);
    expect(summary).toContain('今日は天気がよく');
  });

  it('キーワードがword/desc構造で抽出される', () => {
    const { keywords } = parseLLMResponse(SAMPLE_RESPONSE);
    expect(keywords[0].word).toBe('天気');
    expect(keywords[0].desc).toBe('朝から快晴で気持ちよかった');
    expect(keywords[1].word).toBe('散歩');
    expect(keywords[2].word).toBe('読書');
  });

  it('キーワードの・はwordに含まれない', () => {
    const { keywords } = parseLLMResponse(SAMPLE_RESPONSE);
    expect(keywords.every(k => !k.word.startsWith('・'))).toBe(true);
  });

  it('説明なしのキーワードはdescが空文字', () => {
    const { keywords } = parseLLMResponse('【サマリ】\nテスト\n\n【キーワード】\n・シンプル');
    expect(keywords[0].word).toBe('シンプル');
    expect(keywords[0].desc).toBe('');
  });

  it('存在しないセクションは空', () => {
    const { summary, keywords } = parseLLMResponse('関係ない文章');
    expect(summary).toBe('');
    expect(keywords).toEqual([]);
  });

  it('【サマリー】形式も対応', () => {
    const { summary } = parseLLMResponse('【サマリー】\n要約文\n\n【キーワード】\n・test');
    expect(summary).toContain('要約文');
  });

  it('コロン区切りも対応', () => {
    const { keywords } = parseLLMResponse('【サマリ】\nテスト\n\n【キーワード】\n・天気: 快晴だった');
    expect(keywords[0].word).toBe('天気');
    expect(keywords[0].desc).toBe('快晴だった');
  });
});

// ---- generateTxtContent ----

describe('generateTxtContent', () => {
  const date = '2026年05月17日（土）';
  const bullets = ['晴れた', '散歩した'];
  const summary = '充実した一日だった。';
  const keywords = [
    { word: '天気', desc: '朝から快晴' },
    { word: '散歩', desc: '30分ほど歩いた' },
  ];

  it('=区切りが含まれる', () => {
    const txt = generateTxtContent(date, bullets, summary, keywords, 'diary');
    expect(txt).toContain('===');
  });

  it('日付が含まれる', () => {
    const txt = generateTxtContent(date, bullets, summary, keywords, 'diary');
    expect(txt).toContain(date);
  });

  it('diaryモードは日  記ヘッダー', () => {
    const txt = generateTxtContent(date, bullets, summary, keywords, 'diary');
    expect(txt).toContain('日  記');
  });

  it('book_memoモードは読書ノートヘッダー', () => {
    const txt = generateTxtContent(date, bullets, summary, keywords, 'book_memo');
    expect(txt).toContain('読書ノート');
  });

  it('researchモードは調査ノートヘッダー', () => {
    const txt = generateTxtContent(date, bullets, summary, keywords, 'research');
    expect(txt).toContain('調査ノート');
  });

  it('studyモードは勉強振り返りヘッダー', () => {
    const txt = generateTxtContent(date, bullets, summary, keywords, 'study');
    expect(txt).toContain('勉強振り返り');
  });

  it('nippoモードは```で囲まれる', () => {
    const txt = generateTxtContent(date, bullets, summary, keywords, 'nippo');
    expect(txt.startsWith('```')).toBe(true);
    expect(txt.trimEnd().endsWith('```')).toBe(true);
  });

  it('nippoモードは日報ヘッダーを含む', () => {
    const txt = generateTxtContent(date, bullets, summary, keywords, 'nippo');
    expect(txt).toContain('日報');
  });

  it('本文セクションに箇条書きが含まれる', () => {
    const txt = generateTxtContent(date, bullets, summary, keywords, 'diary');
    expect(txt).toContain('・晴れた');
    expect(txt).toContain('・散歩した');
  });

  it('サマリセクションが含まれる', () => {
    const txt = generateTxtContent(date, bullets, summary, keywords, 'diary');
    expect(txt).toContain('サ マ リ');
    expect(txt).toContain('充実した一日だった');
  });

  it('キーワードセクションにword—desc形式が含まれる', () => {
    const txt = generateTxtContent(date, bullets, summary, keywords, 'diary');
    expect(txt).toContain('キーワード');
    expect(txt).toContain('・天気 — 朝から快晴');
    expect(txt).toContain('・散歩 — 30分ほど歩いた');
  });

  it('descなしキーワードは単独で表示', () => {
    const txt = generateTxtContent(date, bullets, summary, [{ word: '読書', desc: '' }], 'diary');
    expect(txt).toContain('・読書');
    expect(txt).not.toContain('・読書 —');
  });

  it('空のbulletsは（本文なし）と表示', () => {
    const txt = generateTxtContent(date, [], '', [], 'diary');
    expect(txt).toContain('本文なし');
  });
});

// ---- generateFilename ----

describe('generateFilename', () => {
  it('デフォルト(diary)はdiary_で始まる', () => {
    expect(generateFilename('diary').startsWith('diary_')).toBe(true);
  });

  it('book_memoはbook_memo_で始まる', () => {
    expect(generateFilename('book_memo').startsWith('book_memo_')).toBe(true);
  });

  it('researchはresearch_で始まる', () => {
    expect(generateFilename('research').startsWith('research_')).toBe(true);
  });

  it('nippoはnippo_で始まる', () => {
    expect(generateFilename('nippo').startsWith('nippo_')).toBe(true);
  });

  it('studyはstudy_で始まる', () => {
    expect(generateFilename('study').startsWith('study_')).toBe(true);
  });

  it('.txt拡張子', () => {
    expect(generateFilename('diary').endsWith('.txt')).toBe(true);
  });

  it('タイムスタンプ形式 YYYYMMDD_HHMM', () => {
    expect(generateFilename('diary')).toMatch(/diary_\d{8}_\d{4}\.txt/);
  });

  it('book_memoにタイトルとページ範囲が含まれる', () => {
    const name = generateFilename('book_memo', { bookTitle: '思考の整理学', startPage: '1', endPage: '50' });
    expect(name).toMatch(/^book_memo_思考の整理学_001-050_\d{8}_\d{4}\.txt$/);
  });

  it('book_memoのページは3桁ゼロ埋め', () => {
    const name = generateFilename('book_memo', { bookTitle: '本', startPage: '5', endPage: '100' });
    expect(name).toContain('_005-100_');
  });

  it('book_memoのタイトルなしは通常形式', () => {
    expect(generateFilename('book_memo').startsWith('book_memo_')).toBe(true);
    expect(generateFilename('book_memo')).toMatch(/^book_memo_\d{8}_\d{4}\.txt$/);
  });

  it('studyに分野名が含まれる', () => {
    const name = generateFilename('study', { subject: '数学' });
    expect(name).toMatch(/^study_数学_\d{8}_\d{4}\.txt$/);
  });

  it('studyの分野名なしはstudy_タイムスタンプ形式', () => {
    expect(generateFilename('study')).toMatch(/^study_\d{8}_\d{4}\.txt$/);
  });
});

// ---- MODE_CONFIG ----

describe('MODE_CONFIG', () => {
  it('diary・book_memo・research・nippo・studyの5モードが存在する', () => {
    expect(MODE_CONFIG.diary).toBeDefined();
    expect(MODE_CONFIG.book_memo).toBeDefined();
    expect(MODE_CONFIG.research).toBeDefined();
    expect(MODE_CONFIG.nippo).toBeDefined();
    expect(MODE_CONFIG.study).toBeDefined();
  });

  it('各モードにname・txtLabel・placeholderが存在する', () => {
    for (const cfg of Object.values(MODE_CONFIG)) {
      expect(cfg.name).toBeTruthy();
      expect(cfg.txtLabel).toBeTruthy();
      expect(cfg.placeholder).toBeTruthy();
    }
  });
});
