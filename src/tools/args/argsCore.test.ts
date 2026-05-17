import { describe, it, expect } from 'vitest';
import { tokenize, applyMappings, diffIndices, buildResult } from './argsCore';

// ---- tokenize ----

describe('tokenize', () => {
  it('空文字は空配列', () => {
    expect(tokenize('')).toEqual([]);
  });

  it('スペース区切りでトークン分割', () => {
    expect(tokenize('kubectl get pods')).toEqual(['kubectl', 'get', 'pods']);
  });

  it('複数スペースは1つに圧縮', () => {
    expect(tokenize('a  b   c')).toEqual(['a', 'b', 'c']);
  });

  it('前後の空白はトリム', () => {
    expect(tokenize('  cmd arg  ')).toEqual(['cmd', 'arg']);
  });

  it('インデックスは0始まり', () => {
    const tokens = tokenize('a b c');
    expect(tokens[0]).toBe('a');
    expect(tokens[2]).toBe('c');
  });
});

// ---- applyMappings ----

describe('applyMappings', () => {
  it('指定インデックスのトークンを置換', () => {
    const tokens = ['kubectl', 'get', 'pods', '-n', 'default'];
    const result = applyMappings(tokens, [{ index: 4, replacement: 'staging' }]);
    expect(result[4]).toBe('staging');
    expect(result[0]).toBe('kubectl');
  });

  it('複数マッピングを同時適用', () => {
    const tokens = ['a', 'b', 'c'];
    const result = applyMappings(tokens, [
      { index: 0, replacement: 'X' },
      { index: 2, replacement: 'Z' },
    ]);
    expect(result).toEqual(['X', 'b', 'Z']);
  });

  it('範囲外インデックスは無視', () => {
    const tokens = ['a', 'b'];
    const result = applyMappings(tokens, [{ index: 99, replacement: 'Z' }]);
    expect(result).toEqual(['a', 'b']);
  });

  it('replacementが空のマッピングは元のトークンのまま', () => {
    const tokens = ['a', 'b', 'c'];
    const result = applyMappings(tokens, [{ index: 1, replacement: '' }]);
    expect(result[1]).toBe('b');
  });

  it('元の配列を変更しない（イミュータブル）', () => {
    const tokens = ['a', 'b'];
    applyMappings(tokens, [{ index: 0, replacement: 'X' }]);
    expect(tokens[0]).toBe('a');
  });
});

// ---- diffIndices ----

describe('diffIndices', () => {
  it('変更されたインデックスのセットを返す', () => {
    const diff = diffIndices(['a', 'b', 'c'], ['a', 'X', 'c']);
    expect(diff.has(1)).toBe(true);
    expect(diff.has(0)).toBe(false);
    expect(diff.has(2)).toBe(false);
  });

  it('変更なしは空セット', () => {
    expect(diffIndices(['a', 'b'], ['a', 'b']).size).toBe(0);
  });

  it('複数変更はすべて含まれる', () => {
    const diff = diffIndices(['a', 'b', 'c'], ['X', 'b', 'Z']);
    expect(diff.has(0)).toBe(true);
    expect(diff.has(2)).toBe(true);
  });
});

// ---- buildResult ----

describe('buildResult', () => {
  it('トークンをスペース結合', () => {
    expect(buildResult(['kubectl', 'get', 'pods'])).toBe('kubectl get pods');
  });

  it('空配列は空文字', () => {
    expect(buildResult([])).toBe('');
  });
});
