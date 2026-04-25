import { describe, it, expect } from 'vitest';
import { splitText } from './pacerCore';

describe('splitText — paragraph mode', () => {
  it('空文字は空配列を返す', () => {
    expect(splitText('', 'paragraph')).toEqual([]);
  });
  it('空白のみは空配列を返す', () => {
    expect(splitText('   ', 'paragraph')).toEqual([]);
  });
  it('単一段落を1要素の配列で返す', () => {
    expect(splitText('hello world', 'paragraph')).toEqual(['hello world']);
  });
  it('二重改行で段落を分割する', () => {
    expect(splitText('para1\n\npara2', 'paragraph')).toEqual(['para1', 'para2']);
  });
  it('3つ以上の連続改行も1区切りとして扱う', () => {
    expect(splitText('para1\n\n\npara2', 'paragraph')).toEqual(['para1', 'para2']);
  });
  it('空白のみの段落を除外する', () => {
    expect(splitText('para1\n\n   \n\npara2', 'paragraph')).toEqual(['para1', 'para2']);
  });
});

describe('splitText — line mode', () => {
  it('空文字は空配列を返す', () => {
    expect(splitText('', 'line')).toEqual([]);
  });
  it('改行で行を分割する', () => {
    expect(splitText('line1\nline2', 'line')).toEqual(['line1', 'line2']);
  });
  it('空行を除外する', () => {
    expect(splitText('line1\n\nline2', 'line')).toEqual(['line1', 'line2']);
  });
  it('前後の空白をトリムする', () => {
    expect(splitText('  line1  \n  line2  ', 'line')).toEqual(['line1', 'line2']);
  });
});

describe('splitText — chars mode', () => {
  it('空文字は空配列を返す', () => {
    expect(splitText('', 'chars', 100)).toEqual([]);
  });
  it('N文字ごとに分割する', () => {
    expect(splitText('abcdef', 'chars', 3)).toEqual(['abc', 'def']);
  });
  it('端数は最後のチャンクにまとめる', () => {
    expect(splitText('abcde', 'chars', 3)).toEqual(['abc', 'de']);
  });
  it('テキスト全体がN文字以内なら1要素', () => {
    expect(splitText('abc', 'chars', 10)).toEqual(['abc']);
  });
});