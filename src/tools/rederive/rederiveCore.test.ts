import { describe, it, expect } from 'vitest';
import { buildPrompt } from './rederiveCore';

describe('buildPrompt', () => {
  it('空の入力はプレースホルダーを返す', () => {
    expect(buildPrompt('')).toContain('入力');
  });

  it('入力した概念がプロンプトに含まれる', () => {
    expect(buildPrompt('再帰')).toContain('再帰');
  });

  it('問題意識の項目が含まれる', () => {
    expect(buildPrompt('再帰')).toContain('問題意識');
  });

  it('原理からの構築の項目が含まれる', () => {
    expect(buildPrompt('再帰')).toContain('原理からの構築');
  });

  it('再構築の道筋の項目が含まれる', () => {
    expect(buildPrompt('再帰')).toContain('再構築の道筋');
  });
});
