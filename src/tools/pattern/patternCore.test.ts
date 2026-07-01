import { describe, it, expect } from 'vitest';
import { buildPrompt } from './patternCore';

describe('buildPrompt (ja)', () => {
  it('空の入力はプレースホルダーを返す', () => {
    expect(buildPrompt('', 'ja')).toContain('入力');
  });

  it('入力したパターン名がプロンプトに含まれる', () => {
    const result = buildPrompt('Singleton', 'ja');
    expect(result).toContain('Singleton');
  });

  it('概要・適用場面の項目が含まれる', () => {
    const result = buildPrompt('Singleton', 'ja');
    expect(result).toContain('概要');
  });

  it('PHPシンプル実装の項目が含まれる', () => {
    const result = buildPrompt('Singleton', 'ja');
    expect(result).toContain('PHP');
  });

  it('PHPPlaygroundで実行可能な言及がある', () => {
    const result = buildPrompt('Singleton', 'ja');
    expect(result.toLowerCase()).toContain('phpplayground');
  });

  it('実装の説明の項目が含まれる', () => {
    const result = buildPrompt('Singleton', 'ja');
    expect(result).toContain('説明');
  });

  it('関連パターンとの比較の項目が含まれる', () => {
    const result = buildPrompt('Singleton', 'ja');
    expect(result).toContain('関連パターン');
  });
});

describe('buildPrompt (en)', () => {
  it('英語モードでは英語のプロンプトが返る', () => {
    const result = buildPrompt('Singleton', 'en');
    expect(result).toContain('Overview');
  });

  it('入力したパターン名が英語プロンプトに含まれる', () => {
    const result = buildPrompt('Observer', 'en');
    expect(result).toContain('Observer');
  });

  it('PHP Implementationの項目が含まれる', () => {
    const result = buildPrompt('Observer', 'en');
    expect(result).toContain('PHP Implementation');
  });

  it('PHPPlaygroundの言及がある', () => {
    const result = buildPrompt('Observer', 'en');
    expect(result.toLowerCase()).toContain('phpplayground');
  });

  it('Related Patternsの項目が含まれる', () => {
    const result = buildPrompt('Observer', 'en');
    expect(result).toContain('Related Patterns');
  });
});