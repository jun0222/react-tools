import { describe, it, expect } from 'vitest';
import {
  countChars,
  countSentences,
  avgSentenceLength,
  estimateReadingTimeSec,
  getChatLevel,
  getSentenceLengthInfo,
  getSentenceCountInfo,
} from './draftCore';

describe('countChars', () => {
  it('空文字は0', () => { expect(countChars('')).toBe(0); });
  it('ASCII文字をカウント', () => { expect(countChars('hello')).toBe(5); });
  it('日本語文字をカウント', () => { expect(countChars('こんにちは')).toBe(5); });
  it('スペースも含む', () => { expect(countChars('hello world')).toBe(11); });
  it('改行も含む', () => { expect(countChars('a\nb')).toBe(3); });
});

describe('countSentences', () => {
  it('空文字は0', () => { expect(countSentences('')).toBe(0); });
  it('空白のみは0', () => { expect(countSentences('   ')).toBe(0); });
  it('句読点なし1文はカウントされる', () => { expect(countSentences('こんにちは')).toBe(1); });
  it('句点（。）で分割される', () => { expect(countSentences('こんにちは。ありがとう。')).toBe(2); });
  it('感嘆符（！）で分割される', () => { expect(countSentences('いいね！ありがとう！')).toBe(2); });
  it('疑問符（？）で分割される', () => { expect(countSentences('大丈夫？よかった？')).toBe(2); });
  it('英語ピリオドで分割される', () => { expect(countSentences('Hello. World. Done.')).toBe(3); });
  it('改行で分割される', () => { expect(countSentences('Line1\nLine2\nLine3')).toBe(3); });
  it('連続した区切りは1文として扱う', () => { expect(countSentences('Hello!\n\nWorld.')).toBe(2); });
});

describe('avgSentenceLength', () => {
  it('空文字は0', () => { expect(avgSentenceLength('')).toBe(0); });
  it('1文のときその文字数', () => { expect(avgSentenceLength('こんにちは')).toBe(5); });
  it('2文の平均を返す', () => {
    // 'AAAA。BB。' → ['AAAA', 'BB'] → (4+2)/2 = 3
    expect(avgSentenceLength('AAAA。BB。')).toBe(3);
  });
});

describe('estimateReadingTimeSec', () => {
  it('空文字は0', () => { expect(estimateReadingTimeSec('')).toBe(0); });
  it('500文字は60秒', () => {
    const text = 'あ'.repeat(500);
    expect(estimateReadingTimeSec(text)).toBe(60);
  });
  it('250文字は30秒', () => {
    const text = 'あ'.repeat(250);
    expect(estimateReadingTimeSec(text)).toBe(30);
  });
  it('1文字でも1秒以上', () => {
    expect(estimateReadingTimeSec('a')).toBeGreaterThan(0);
  });
});

describe('getChatLevel', () => {
  it('0文字はgreen', () => { expect(getChatLevel(0).level).toBe('green'); });
  it('150文字はgreen', () => { expect(getChatLevel(150).level).toBe('green'); });
  it('151文字はyellow', () => { expect(getChatLevel(151).level).toBe('yellow'); });
  it('400文字はyellow', () => { expect(getChatLevel(400).level).toBe('yellow'); });
  it('401文字はorange', () => { expect(getChatLevel(401).level).toBe('orange'); });
  it('800文字はorange', () => { expect(getChatLevel(800).level).toBe('orange'); });
  it('801文字はred', () => { expect(getChatLevel(801).level).toBe('red'); });
  it('1500文字はred', () => { expect(getChatLevel(1500).level).toBe('red'); });
  it('1501文字はdark-red', () => { expect(getChatLevel(1501).level).toBe('dark-red'); });
  it('返り値にlabel・suggestion・emojiが含まれる', () => {
    const info = getChatLevel(100);
    expect(info.label).toBeTruthy();
    expect(info.suggestion).toBeTruthy();
    expect(info.emoji).toBeTruthy();
  });
});

describe('getSentenceLengthInfo', () => {
  it('0はgreen', () => { expect(getSentenceLengthInfo(0).level).toBe('green'); });
  it('15以下はgreen', () => { expect(getSentenceLengthInfo(15).level).toBe('green'); });
  it('16〜30はyellow', () => { expect(getSentenceLengthInfo(16).level).toBe('yellow'); });
  it('30はyellow', () => { expect(getSentenceLengthInfo(30).level).toBe('yellow'); });
  it('31以上はred', () => { expect(getSentenceLengthInfo(31).level).toBe('red'); });
});

describe('getSentenceCountInfo', () => {
  it('0はgreen', () => { expect(getSentenceCountInfo(0).level).toBe('green'); });
  it('3以下はgreen', () => { expect(getSentenceCountInfo(3).level).toBe('green'); });
  it('4〜7はyellow', () => { expect(getSentenceCountInfo(4).level).toBe('yellow'); });
  it('8以上はred', () => { expect(getSentenceCountInfo(8).level).toBe('red'); });
});