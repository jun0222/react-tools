import { describe, it, expect } from 'vitest';
import { buildPrompt } from './unpackCore';

describe('buildPrompt', () => {
  it('空の入力はプレースホルダーを返す', () => {
    expect(buildPrompt('')).toContain('入力');
  });

  it('入力した単語がプロンプトに含まれる', () => {
    const result = buildPrompt('再帰');
    expect(result).toContain('再帰');
  });

  it('分解の項目が含まれる', () => {
    const result = buildPrompt('再帰');
    expect(result).toContain('分解');
  });

  it('関係の項目が含まれる', () => {
    const result = buildPrompt('再帰');
    expect(result).toContain('関係');
  });

  it('マーキングの項目が含まれる', () => {
    const result = buildPrompt('再帰');
    expect(result).toContain('マーキング');
  });

  it('継続ルールの項目が含まれる', () => {
    const result = buildPrompt('再帰');
    expect(result).toContain('継続ルール');
  });
});