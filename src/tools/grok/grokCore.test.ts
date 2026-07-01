import { describe, it, expect } from 'vitest';
import { buildPrompt } from './grokCore';

describe('buildPrompt (ja)', () => {
  it('空の入力はプレースホルダーを返す', () => {
    expect(buildPrompt('', 'ja')).toContain('入力');
  });

  it('入力した概念がプロンプトに含まれる', () => {
    const result = buildPrompt('再帰', 'ja');
    expect(result).toContain('再帰');
  });

  it('本質・仕組みの項目が含まれる', () => {
    const result = buildPrompt('再帰', 'ja');
    expect(result).toContain('本質');
  });

  it('直感的なアナロジーの項目が含まれる', () => {
    const result = buildPrompt('再帰', 'ja');
    expect(result).toContain('アナロジー');
  });

  it('ゼロからの再導出の項目が含まれる', () => {
    const result = buildPrompt('再帰', 'ja');
    expect(result).toContain('再導出');
  });

  it('暗記不要の根拠の項目が含まれる', () => {
    const result = buildPrompt('再帰', 'ja');
    expect(result).toContain('暗記');
  });
});

describe('buildPrompt (en)', () => {
  it('英語モードでは英語のプロンプトが返る', () => {
    const result = buildPrompt('recursion', 'en');
    expect(result).toContain('Mechanism');
  });

  it('入力した概念が英語プロンプトにも含まれる', () => {
    const result = buildPrompt('recursion', 'en');
    expect(result).toContain('recursion');
  });

  it('Analogyの項目が含まれる', () => {
    const result = buildPrompt('recursion', 'en');
    expect(result).toContain('Analogy');
  });

  it('First Principlesの項目が含まれる', () => {
    const result = buildPrompt('recursion', 'en');
    expect(result).toContain('First Principles');
  });

  it('Memorizeの項目が含まれる', () => {
    const result = buildPrompt('recursion', 'en');
    expect(result).toContain('Memorize');
  });
});