import { describe, it, expect } from 'vitest';
import { cycleElapsedSec, beepCount, fmtSeconds } from './intervalbellCore';

describe('cycleElapsedSec', () => {
  it('サイクル開始直後は0を返す', () => {
    expect(cycleElapsedSec(0, 30)).toBe(0);
  });

  it('サイクル内の経過秒数を返す', () => {
    expect(cycleElapsedSec(7_000, 30)).toBe(7);
  });

  it('インターバルちょうどで0に戻る', () => {
    expect(cycleElapsedSec(30_000, 30)).toBe(0);
  });

  it('2周目でも正しくサイクル内秒数を返す', () => {
    expect(cycleElapsedSec(37_000, 30)).toBe(7);
  });
});

describe('beepCount', () => {
  it('サイクル未完了なら0', () => {
    expect(beepCount(29_000, 30)).toBe(0);
  });

  it('1インターバル経過で1になる', () => {
    expect(beepCount(30_000, 30)).toBe(1);
  });

  it('複数インターバル経過で回数が増える', () => {
    expect(beepCount(95_000, 30)).toBe(3);
  });
});

describe('fmtSeconds', () => {
  it('60秒未満はM:SS形式にならず0:SS', () => {
    expect(fmtSeconds(7)).toBe('0:07');
  });

  it('分と秒に変換される', () => {
    expect(fmtSeconds(125)).toBe('2:05');
  });
});
