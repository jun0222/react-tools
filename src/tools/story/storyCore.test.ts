import { describe, it, expect } from 'vitest';
import { buildPrompt, TEMPLATES } from './storyCore';

describe('TEMPLATES', () => {
  it('三幕構成・起承転結・ヒーローズジャーニーの3種類が登録されている', () => {
    const ids = TEMPLATES.map(t => t.id);
    expect(ids).toEqual(['three-act', 'kishotenketsu', 'heros-journey']);
  });
});

describe('buildPrompt', () => {
  it('空の断片はプレースホルダーを返す', () => {
    expect(buildPrompt('', 'three-act', false)).toContain('入力');
  });

  it('入力した断片がプロンプトに含まれる', () => {
    const result = buildPrompt('孤独な発明家の話', 'three-act', false);
    expect(result).toContain('孤独な発明家の話');
  });

  it('三幕構成を選ぶと第一幕〜第三幕の説明が含まれる', () => {
    const result = buildPrompt('断片', 'three-act', false);
    expect(result).toContain('第一幕');
    expect(result).toContain('第二幕');
    expect(result).toContain('第三幕');
  });

  it('起承転結を選ぶと起承転結の説明が含まれる', () => {
    const result = buildPrompt('断片', 'kishotenketsu', false);
    expect(result).toContain('起：');
    expect(result).toContain('承：');
    expect(result).toContain('転：');
    expect(result).toContain('結：');
  });

  it('ヒーローズジャーニーを選ぶとその段階の説明が含まれる', () => {
    const result = buildPrompt('断片', 'heros-journey', false);
    expect(result).toContain('日常世界');
    expect(result).toContain('冒険への誘い');
    expect(result).toContain('帰還');
  });

  it('学習モードOFFのときは学習モードの指示が含まれない', () => {
    const result = buildPrompt('断片', 'three-act', false);
    expect(result).not.toContain('学習モード');
  });

  it('学習モードONのときは記憶定着の指示が含まれる', () => {
    const result = buildPrompt('断片', 'three-act', true);
    expect(result).toContain('学習モード');
    expect(result).toContain('記憶に定着');
  });
});
