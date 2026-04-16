import { describe, it, expect } from 'vitest';
import {
  buildKMPFailure,
  kmpFindAll,
  kmpReplace,
  LCG,
  getCharPool,
  POOL_LOWER, POOL_UPPER, POOL_DIGIT, POOL_HIRA, POOL_KATA, POOL_KANJI,
  applyReplacePairs,
  applyRandomRules,
  processPhantom,
} from './phantomCore';
import type { ReplacePair, RandomRule } from './phantomCore';

const makePair = (from: string, to: string, enabled = true): ReplacePair => ({
  id: from || 'x', from, to, enabled,
});
const makeRule = (targetStr: string, enabled = true): RandomRule => ({
  id: targetStr || 'r', targetStr, enabled,
});

// =============================================
// buildKMPFailure
// =============================================
describe('buildKMPFailure', () => {
  it('空文字列 → 空配列', () => {
    expect(buildKMPFailure('')).toEqual([]);
  });
  it('1文字 → [0]', () => {
    expect(buildKMPFailure('a')).toEqual([0]);
  });
  it('"aabaa" → [0,1,0,1,2]', () => {
    expect(buildKMPFailure('aabaa')).toEqual([0, 1, 0, 1, 2]);
  });
  it('"abcabc" → [0,0,0,1,2,3]', () => {
    expect(buildKMPFailure('abcabc')).toEqual([0, 0, 0, 1, 2, 3]);
  });
  it('"aaaa" → [0,1,2,3]', () => {
    expect(buildKMPFailure('aaaa')).toEqual([0, 1, 2, 3]);
  });
});

// =============================================
// kmpFindAll
// =============================================
describe('kmpFindAll', () => {
  it('空パターン → []', () => {
    expect(kmpFindAll('hello', '')).toEqual([]);
  });
  it('パターンがテキストより長い → []', () => {
    expect(kmpFindAll('ab', 'abc')).toEqual([]);
  });
  it('1件ヒット', () => {
    expect(kmpFindAll('hello world', 'world')).toEqual([6]);
  });
  it('複数件ヒット', () => {
    expect(kmpFindAll('abcabcabc', 'abc')).toEqual([0, 3, 6]);
  });
  it('見つからない → []', () => {
    expect(kmpFindAll('hello', 'xyz')).toEqual([]);
  });
  it('重なりのあるパターン "aa" in "aaaa" → [0,1,2]', () => {
    expect(kmpFindAll('aaaa', 'aa')).toEqual([0, 1, 2]);
  });
  it('先頭・末尾ヒット', () => {
    expect(kmpFindAll('abXab', 'ab')).toEqual([0, 3]);
  });
  it('テキストとパターンが同じ → [0]', () => {
    expect(kmpFindAll('abc', 'abc')).toEqual([0]);
  });
});

// =============================================
// kmpReplace
// =============================================
describe('kmpReplace', () => {
  it('空パターン → 変更なし', () => {
    expect(kmpReplace('hello', '', 'X')).toBe('hello');
  });
  it('ヒットなし → 変更なし', () => {
    expect(kmpReplace('hello', 'xyz', 'X')).toBe('hello');
  });
  it('1件置換', () => {
    expect(kmpReplace('hello world', 'world', 'there')).toBe('hello there');
  });
  it('複数件置換', () => {
    expect(kmpReplace('aaa', 'a', 'b')).toBe('bbb');
  });
  it('to が空文字列 → 削除', () => {
    expect(kmpReplace('hello world', ' world', '')).toBe('hello');
  });
  it('重なりが発生するパターンは最左優先で非重複置換', () => {
    expect(kmpReplace('aaaa', 'aa', 'X')).toBe('XX');
  });
  it('日本語テキストも正しく置換', () => {
    expect(kmpReplace('おはようございます', 'おはよう', 'こんにちは')).toBe('こんにちはございます');
  });
});

// =============================================
// LCG
// =============================================
describe('LCG', () => {
  it('生成値は [0, 1) の範囲', () => {
    const lcg = new LCG(42);
    for (let i = 0; i < 1000; i++) {
      const v = lcg.next();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
  it('同じシードは同じ乱数列を生成する（再現性）', () => {
    const a = new LCG(99);
    const b = new LCG(99);
    for (let i = 0; i < 20; i++) expect(a.next()).toBe(b.next());
  });
  it('異なるシードは（ほぼ）異なる値を生成する', () => {
    expect(new LCG(1).next()).not.toBe(new LCG(9999).next());
  });
  it('pick は配列の要素を返す', () => {
    const lcg = new LCG(7);
    const arr = ['x', 'y', 'z'];
    for (let i = 0; i < 100; i++) expect(arr).toContain(lcg.pick(arr));
  });
  it('pick は配列の全要素を（十分な試行で）選択しうる', () => {
    const lcg = new LCG(0);
    const arr = ['a', 'b', 'c', 'd'];
    const seen = new Set<string>();
    for (let i = 0; i < 200; i++) seen.add(lcg.pick(arr));
    expect(seen.size).toBe(arr.length);
  });
});

// =============================================
// getCharPool
// =============================================
describe('getCharPool', () => {
  it('小文字 → POOL_LOWER', () => {
    expect(getCharPool('a')).toBe(POOL_LOWER);
    expect(getCharPool('z')).toBe(POOL_LOWER);
  });
  it('大文字 → POOL_UPPER', () => {
    expect(getCharPool('A')).toBe(POOL_UPPER);
    expect(getCharPool('Z')).toBe(POOL_UPPER);
  });
  it('数字 → POOL_DIGIT', () => {
    expect(getCharPool('0')).toBe(POOL_DIGIT);
    expect(getCharPool('9')).toBe(POOL_DIGIT);
  });
  it('ひらがな → POOL_HIRA', () => {
    expect(getCharPool('あ')).toBe(POOL_HIRA);
    expect(getCharPool('ん')).toBe(POOL_HIRA);
  });
  it('カタカナ → POOL_KATA', () => {
    expect(getCharPool('ア')).toBe(POOL_KATA);
    expect(getCharPool('ン')).toBe(POOL_KATA);
  });
  it('漢字 → POOL_KANJI', () => {
    expect(getCharPool('東')).toBe(POOL_KANJI);
    expect(getCharPool('字')).toBe(POOL_KANJI);
  });
  it('記号・スペースなど未知のクラス → null', () => {
    expect(getCharPool(' ')).toBeNull();
    expect(getCharPool('!')).toBeNull();
    expect(getCharPool('。')).toBeNull();
  });
});

// =============================================
// applyReplacePairs
// =============================================
describe('applyReplacePairs', () => {
  it('ペアなし → 変更なし', () => {
    expect(applyReplacePairs('hello', [])).toBe('hello');
  });
  it('1ペア適用', () => {
    expect(applyReplacePairs('hello', [makePair('l', 'L')])).toBe('heLLo');
  });
  it('複数ペアを順番に適用', () => {
    expect(applyReplacePairs('abc', [makePair('a', 'b'), makePair('b', 'c')])).toBe('ccc');
  });
  it('disabled なペアはスキップ', () => {
    expect(applyReplacePairs('ab', [makePair('a', 'X', false), makePair('b', 'Y')])).toBe('aY');
  });
  it('from が空のペアはスキップ', () => {
    expect(applyReplacePairs('abc', [makePair('', 'X'), makePair('a', 'Z')])).toBe('Zbc');
  });
});

// =============================================
// applyRandomRules — 対象文字列マッチング
// =============================================
describe('applyRandomRules', () => {
  const SEED = 1;

  it('ルールなし → 変更なし', () => {
    expect(applyRandomRules('hello', [], SEED)).toBe('hello');
  });

  it('対象文字列が存在しない場合は変換されない', () => {
    expect(applyRandomRules('hello', [makeRule('xyz')], SEED)).toBe('hello');
  });

  it('対象文字列の一致部分だけがランダム変換される（外側は変わらない）', () => {
    // 'this is ka3afai' → 'this is ' は不変、'ka3afai' の7文字が変換される
    const result = applyRandomRules('this is ka3afai', [makeRule('ka3afai')], SEED);
    expect(result.substring(0, 8)).toBe('this is ');
    expect(result).toHaveLength(15);
    expect(result.substring(8)).not.toBe('ka3afai');
  });

  it('小文字は小文字に変換される（元の文字を除く）', () => {
    const result = applyRandomRules('hello', [makeRule('ello')], SEED);
    expect(result[0]).toBe('h'); // 対象外
    for (let i = 1; i < 5; i++) {
      expect(result[i]).toMatch(/[a-z]/);
    }
    expect(result[1]).not.toBe('e');
    expect(result[2]).not.toBe('l');
  });

  it('大文字は大文字に変換される', () => {
    const result = applyRandomRules('HELLO', [makeRule('ELL')], SEED);
    expect(result[0]).toBe('H');
    expect(result[4]).toBe('O');
    expect(result[1]).toMatch(/[A-Z]/);
    expect(result[1]).not.toBe('E');
  });

  it('ひらがなはひらがなに変換される', () => {
    const result = applyRandomRules('あいうえお', [makeRule('いう')], SEED);
    expect(result[0]).toBe('あ'); // 対象外
    expect(result[3]).toBe('え'); // 対象外
    const code1 = result[1].codePointAt(0)!;
    const code2 = result[2].codePointAt(0)!;
    expect(code1).toBeGreaterThanOrEqual(0x3041);
    expect(code1).toBeLessThanOrEqual(0x3096);
    expect(code2).toBeGreaterThanOrEqual(0x3041);
    expect(code2).toBeLessThanOrEqual(0x3096);
  });

  it('未知クラス（スペース・記号など）は変換されない', () => {
    const result = applyRandomRules('a b', [makeRule('a b')], SEED);
    // 'a' → randomized, ' ' → unchanged, 'b' → randomized
    expect(result[1]).toBe(' ');
    expect(result[0]).toMatch(/[a-z]/);
    expect(result[0]).not.toBe('a');
  });

  it('対象文字列が複数回現れる場合はすべて変換される', () => {
    const result = applyRandomRules('aabcabc', [makeRule('abc')], SEED);
    // 先頭の 'a' は対象外
    expect(result[0]).toBe('a');
    // 残り 'abc' × 2 が変換される
    expect(result[1]).not.toBe('a');
    expect(result[4]).not.toBe('a');
  });

  it('disabled なルールはスキップ', () => {
    expect(applyRandomRules('hello', [makeRule('ello', false)], SEED)).toBe('hello');
  });

  it('targetStr が空のルールはスキップ', () => {
    expect(applyRandomRules('hello', [makeRule('')], SEED)).toBe('hello');
  });

  it('同じシードは同じ出力を生成する（再現性）', () => {
    const rules = [makeRule('hello')];
    expect(applyRandomRules('hello world', rules, 42))
      .toBe(applyRandomRules('hello world', rules, 42));
  });

  it('異なるシードは（通常）異なる出力を生成する', () => {
    const rules = [makeRule('helloworld')];
    expect(applyRandomRules('helloworld', rules, 1))
      .not.toBe(applyRandomRules('helloworld', rules, 999999));
  });
});

// =============================================
// processPhantom (統合)
// =============================================
describe('processPhantom', () => {
  it('ペアもルールもない → 変更なし', () => {
    expect(processPhantom('hello', [], [], 1)).toBe('hello');
  });

  it('ペアのみ適用', () => {
    expect(processPhantom('hello', [makePair('l', 'L')], [], 1)).toBe('heLLo');
  });

  it('ランダムルールのみ：一致部分だけ変換', () => {
    const result = processPhantom('this is ka3afai', [], [makeRule('ka3afai')], 1);
    expect(result.substring(0, 8)).toBe('this is ');
    expect(result.substring(8)).not.toBe('ka3afai');
  });

  it('ペアで置換済みの文字列にランダムルールが適用される', () => {
    // 'this is ka3afai' → pairs: ka3afai→hoge → 'this is hoge'
    // → rules: ka3afai はもはや存在しないので変換なし
    const pairs = [makePair('ka3afai', 'hoge')];
    const rules = [makeRule('ka3afai')];
    const result = processPhantom('this is ka3afai', pairs, rules, 1);
    expect(result).toBe('this is hoge');
  });
});