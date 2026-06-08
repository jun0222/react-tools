import { describe, it, expect } from 'vitest';
import { parseMessages } from './convmapCore';

describe('parseMessages', () => {
  it('空テキストは空配列を返す', () => {
    expect(parseMessages('', '🤖')).toEqual([]);
    expect(parseMessages('   ', '🤖')).toEqual([]);
  });

  it('合言葉なしは全部ユーザーメッセージにする（連続ブロックは結合）', () => {
    const msgs = parseMessages('こんにちは\n\n元気ですか', '');
    expect(msgs.every(m => m.role === 'user')).toBe(true);
    expect(msgs[0].text).toContain('こんにちは');
  });

  it('合言葉で始まるブロックをLLMメッセージにする', () => {
    const text = '質問です\n\n🤖\n答えです';
    const msgs = parseMessages(text, '🤖');
    expect(msgs[0].role).toBe('user');
    expect(msgs[0].text).toBe('質問です');
    expect(msgs[1].role).toBe('llm');
    expect(msgs[1].text).toBe('答えです');
  });

  it('合言葉部分をLLMテキストから除去する', () => {
    const msgs = parseMessages('🤖\nHello', '🤖');
    expect(msgs[0].text).toBe('Hello');
  });

  it('連続するユーザーブロックを結合する', () => {
    const text = 'first\n\nsecond\n\n🤖\nanswer';
    const msgs = parseMessages(text, '🤖');
    expect(msgs[0].role).toBe('user');
    expect(msgs[0].text).toContain('first');
    expect(msgs[0].text).toContain('second');
    expect(msgs).toHaveLength(2);
  });

  it('複数の会話ターンを処理する', () => {
    const text = '質問1\n\n🤖\n答え1\n\n質問2\n\n🤖\n答え2';
    const msgs = parseMessages(text, '🤖');
    expect(msgs).toHaveLength(4);
    expect(msgs[0]).toEqual({ role: 'user', text: '質問1' });
    expect(msgs[1]).toEqual({ role: 'llm', text: '答え1' });
    expect(msgs[2]).toEqual({ role: 'user', text: '質問2' });
    expect(msgs[3]).toEqual({ role: 'llm', text: '答え2' });
  });

  it('合言葉が前後にスペースありでも正しく動作する', () => {
    const msgs = parseMessages('🤖  答え', '🤖');
    expect(msgs[0].role).toBe('llm');
    expect(msgs[0].text).toBe('答え');
  });
});
