import { describe, it, expect } from 'vitest';
import {
  buildKMPFailure,
  kmpFindAll,
  kmpReplace,
  LCG,
  applyReplacePairs,
  applyRandomRules,
  processPhantom,
} from './phantom';
import type { ReplacePair, RandomRule } from './phantom';

const pid = (id: string) => id;

const makePair = (from: string, to: string, enabled = true): ReplacePair => ({
  id: pid(from || 'x'), from, to, enabled,
});
const makeRule = (targetChars: string, charSet: string, enabled = true): RandomRule => ({
  id: targetChars || 'r', targetChars, charSet, enabled,
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
    // "aa" in "aaa": positions [0,1,2] → apply pos 0, next >= 2, apply pos 2
    // result: "b" + "b" + "" = but wait, kmpFindAll returns [0,1,2]
    // with cursor logic: pos=0 (>=0) → 'b', cursor=2; pos=1 (<2 skip); pos=2 (>=2) → 'b', cursor=4; rest ''
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
    for (let i = 0; i < 20; i++) {
      expect(a.next()).toBe(b.next());
    }
  });

  it('異なるシードは（ほぼ）異なる値を生成する', () => {
    const a = new LCG(1);
    const b = new LCG(9999);
    expect(a.next()).not.toBe(b.next());
  });

  it('pick は配列の要素を返す', () => {
    const lcg = new LCG(7);
    const arr = ['x', 'y', 'z'];
    for (let i = 0; i < 100; i++) {
      expect(arr).toContain(lcg.pick(arr));
    }
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
    const pairs = [makePair('a', 'b'), makePair('b', 'c')];
    // 'a' → 'b' → 'c' (順番依存)
    expect(applyReplacePairs('abc', pairs)).toBe('ccc');
  });

  it('disabled なペアはスキップ', () => {
    const pairs = [makePair('a', 'X', false), makePair('b', 'Y')];
    expect(applyReplacePairs('ab', pairs)).toBe('aY');
  });

  it('from が空のペアはスキップ', () => {
    const pairs = [makePair('', 'X'), makePair('a', 'Z')];
    expect(applyReplacePairs('abc', pairs)).toBe('Zbc');
  });
});

// =============================================
// applyRandomRules
// =============================================
describe('applyRandomRules', () => {
  const SEED = 1;

  it('ルールなし → 変更なし', () => {
    expect(applyRandomRules('hello', [], SEED)).toBe('hello');
  });

  it('対象外文字は変換されない', () => {
    const rules = [makeRule('xyz', '★')];
    expect(applyRandomRules('abc', rules, SEED)).toBe('abc');
  });

  it('変換先が1文字のとき全対象文字がその文字に変換される', () => {
    const rules = [makeRule('aeiou', '★')];
    expect(applyRandomRules('hello', rules, SEED)).toBe('h★ll★');
  });

  it('変換先の文字セットの中からいずれかの文字が選ばれる', () => {
    const charSet = 'ABC';
    const rules = [makeRule('x', charSet)];
    const result = applyRandomRules('xxx', rules, SEED);
    for (const ch of result) {
      expect(charSet).toContain(ch);
    }
  });

  it('disabled なルールはスキップ', () => {
    const rules = [makeRule('abc', '★', false)];
    expect(applyRandomRules('abc', rules, SEED)).toBe('abc');
  });

  it('targetChars が空のルールはスキップ', () => {
    const rules = [makeRule('', '★')];
    expect(applyRandomRules('abc', rules, SEED)).toBe('abc');
  });

  it('同じシードは同じ出力を生成する（再現性）', () => {
    const rules = [makeRule('abc', 'XYZ')];
    const r1 = applyRandomRules('abcabc', rules, 42);
    const r2 = applyRandomRules('abcabc', rules, 42);
    expect(r1).toBe(r2);
  });

  it('異なるシードは（通常）異なる出力を生成する', () => {
    const rules = [makeRule('abcdefghijklmnopqrstuvwxyz', 'XYZ')];
    const r1 = applyRandomRules('helloworld', rules, 1);
    const r2 = applyRandomRules('helloworld', rules, 999999);
    // 確率的にほぼ異なるはず（同じになる確率は (1/3)^10 ≈ 0.0017%）
    expect(r1).not.toBe(r2);
  });
});

// =============================================
// processPhantom (統合)
// =============================================
describe('processPhantom', () => {
  it('ペアもルールもない → 変更なし', () => {
    expect(processPhantom('hello', [], [], 1)).toBe('hello');
  });

  it('ペアが先に適用され、次にランダムルールが適用される', () => {
    // 'aaa' → pairs: a→X → 'XXX' → rules: X→★ → '★★★'
    const pairs = [makePair('a', 'X')];
    const rules = [makeRule('X', '★')];
    expect(processPhantom('aaa', pairs, rules, 1)).toBe('★★★');
  });

  it('ペアのみ適用', () => {
    expect(processPhantom('hello', [makePair('l', 'L')], [], 1)).toBe('heLLo');
  });

  it('ランダムルールのみ適用', () => {
    expect(processPhantom('hello', [], [makeRule('aeiou', '?')], 1)).toBe('h?ll?');
  });
});
