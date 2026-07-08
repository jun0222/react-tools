import { describe, it, expect } from 'vitest';
import { buildPrompt } from './shakyoCore';

describe('buildPrompt', () => {
  it('空の入力はプレースホルダーを返す', () => {
    expect(buildPrompt('')).toContain('入力');
  });

  it('入力した対象領域がそのまま埋め込まれる', () => {
    expect(buildPrompt('システム開発')).toContain('システム開発において');
  });

  it('対象領域を変えるとその文言に置き換わる', () => {
    expect(buildPrompt('モバイルアプリ開発')).toContain('モバイルアプリ開発において');
  });

  it('5つ作成する指示が含まれる', () => {
    expect(buildPrompt('システム開発')).toContain('5つ');
  });

  it('写経（書き写す）への言及が含まれる', () => {
    expect(buildPrompt('システム開発')).toContain('写経');
  });

  it('空中戦を終わらせる条件が含まれる', () => {
    expect(buildPrompt('システム開発')).toContain('空中戦');
  });

  it('前後の文脈なしで意味が通る条件が含まれる', () => {
    expect(buildPrompt('システム開発')).toContain('前後の文脈がなくても');
  });

  it('番号付きリストの条件が含まれる', () => {
    expect(buildPrompt('システム開発')).toContain('番号付きリスト');
  });
});