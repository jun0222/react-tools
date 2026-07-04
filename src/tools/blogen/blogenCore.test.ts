import { describe, it, expect } from 'vitest';
import { buildPrompt, DEFAULT_N } from './blogenCore';

describe('buildPrompt', () => {
  it('デフォルトの文字数は30である', () => {
    expect(DEFAULT_N).toBe(30);
  });

  it('空の入力はプレースホルダーを返す', () => {
    expect(buildPrompt('', 30)).toContain('入力');
  });

  it('入力したトピックと文字数がプロンプトに含まれる', () => {
    expect(buildPrompt('猫', 30)).toBe('「猫」について30文字でブログを書いて。');
  });

  it('文字数を変えるとプロンプトに反映される', () => {
    expect(buildPrompt('猫', 500)).toBe('「猫」について500文字でブログを書いて。');
  });
});