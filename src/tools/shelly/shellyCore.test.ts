import { describe, it, expect } from 'vitest';
import { buildPrompt } from './shellyCore';

describe('buildPrompt', () => {
  it('POSIX標準への言及が含まれる', () => {
    expect(buildPrompt('')).toContain('POSIX');
  });

  it('質問は1つだけというルールが含まれる', () => {
    expect(buildPrompt('')).toContain('質問は1つだけ');
  });

  it('ドライランの安全対策ルールが含まれる', () => {
    expect(buildPrompt('')).toContain('ドライラン');
  });

  it('引数エラー処理のルールが含まれる', () => {
    expect(buildPrompt('')).toContain('エラーメッセージ');
  });

  it('ヒント未入力のときヒント行が含まれない', () => {
    expect(buildPrompt('')).not.toContain('ヒント:');
  });

  it('ヒントを入力するとプロンプトに反映される', () => {
    expect(buildPrompt('一時ファイルの一括削除')).toContain('ヒント: 一時ファイルの一括削除');
  });
});