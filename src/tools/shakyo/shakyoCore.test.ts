import { describe, it, expect } from 'vitest';
import { buildPrompt } from './shakyoCore';

describe('buildPrompt', () => {
  it('空の入力はプレースホルダーを返す', () => {
    expect(buildPrompt('')).toContain('入力');
  });

  it('抽出数5の指示が含まれる', () => {
    expect(buildPrompt('テスト文章')).toContain('5つ');
  });

  it('写経の目的が含まれる', () => {
    expect(buildPrompt('テスト文章')).toContain('写経');
  });

  it('入力した文章がプロンプトに含まれる', () => {
    expect(buildPrompt('これはテスト文章です。')).toContain('これはテスト文章です。');
  });

  it('文脈なしで意味が通る条件が含まれる', () => {
    expect(buildPrompt('テスト文章')).toContain('前後の文脈がなくても');
  });
});
