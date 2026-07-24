import { describe, it, expect } from 'vitest';
import {
  BOXES,
  CONNECTIONS,
  MIN_CH,
  boxWidthCh,
  boxRows,
  emptyTexts,
  exportJson,
  importJson,
  tickForConnection,
  arrowHeadPoints,
  sanitizeFileName,
  checkKotoba,
  isAuthValid,
  nextAuthUntil,
  AUTH_DURATION_MS,
} from './symtreeCore';

describe('BOXES', () => {
  it('idが重複しない', () => {
    const ids = BOXES.map(b => b.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('全ボックスの座標が0〜100の範囲に収まる', () => {
    for (const b of BOXES) {
      expect(b.x).toBeGreaterThanOrEqual(0);
      expect(b.x).toBeLessThanOrEqual(100);
      expect(b.y).toBeGreaterThanOrEqual(0);
      expect(b.y).toBeLessThanOrEqual(100);
    }
  });

  it('全ボックスにセフィロトの名前・背景色・文字色・解説が設定されている', () => {
    for (const b of BOXES) {
      expect(b.label.length).toBeGreaterThan(0);
      expect(b.bg).toMatch(/^#[0-9a-f]{6}$/i);
      expect(b.fg).toMatch(/^#[0-9a-f]{6}$/i);
      expect(b.desc.length).toBeGreaterThan(0);
    }
  });

  it('10個のセフィラを持つ', () => {
    expect(BOXES).toHaveLength(10);
  });
});

describe('CONNECTIONS', () => {
  it('from/toが全てBOXESに存在するidを指す', () => {
    const ids = new Set(BOXES.map(b => b.id));
    for (const c of CONNECTIONS) {
      expect(ids.has(c.from)).toBe(true);
      expect(ids.has(c.to)).toBe(true);
    }
  });
});

describe('boxWidthCh', () => {
  it('空文字のときMIN_CHを返す', () => {
    expect(boxWidthCh('')).toBe(MIN_CH);
  });

  it('MIN_CHより短い文字列でもMIN_CHを返す', () => {
    expect(boxWidthCh('あ')).toBe(MIN_CH);
  });

  it('MIN_CHを超える長さの文字列は文字数+2を返す', () => {
    const text = 'a'.repeat(MIN_CH + 5);
    expect(boxWidthCh(text)).toBe(text.length + 2);
  });

  it('複数行のときは最も長い行の長さを基準にする', () => {
    const longLine = 'a'.repeat(MIN_CH + 10);
    const text = `短い\n${longLine}\n中くらいの行`;
    expect(boxWidthCh(text)).toBe(longLine.length + 2);
  });

  it('全ての行がMIN_CH未満ならMIN_CHを返す', () => {
    expect(boxWidthCh('あ\nい\nう')).toBe(MIN_CH);
  });

  it('全角文字は半角の2倍の幅として計算される', () => {
    const text = 'あ'.repeat(10);
    expect(boxWidthCh(text)).toBe(20 + 2);
  });

  it('全角と半角が混在する行も正しく幅を計算する', () => {
    const text = 'aあaあaあaあaあaあ';
    expect(boxWidthCh(text)).toBe((6 * 1 + 6 * 2) + 2);
  });
});

describe('boxRows', () => {
  it('空文字のときは1を返す', () => {
    expect(boxRows('')).toBe(1);
  });

  it('改行がない場合は1を返す', () => {
    expect(boxRows('こんにちは')).toBe(1);
  });

  it('改行の数+1を返す', () => {
    expect(boxRows('1行目\n2行目\n3行目')).toBe(3);
  });
});

describe('emptyTexts', () => {
  it('全ボックスidを空文字で初期化する', () => {
    const texts = emptyTexts();
    expect(Object.keys(texts).sort()).toEqual(BOXES.map(b => b.id).sort());
    expect(Object.values(texts).every(v => v === '')).toBe(true);
  });
});

describe('exportJson / importJson', () => {
  it('exportJsonしたものをimportJsonすると同じ内容が復元される', () => {
    const texts = { ...emptyTexts(), b1: 'テスト' };
    const json = exportJson(texts);
    expect(importJson(json)).toEqual(texts);
  });

  it('不正なJSON文字列はnullを返す', () => {
    expect(importJson('{invalid')).toBeNull();
  });

  it('配列やnullなどオブジェクト以外はnullを返す', () => {
    expect(importJson('[]')).toBeNull();
    expect(importJson('null')).toBeNull();
    expect(importJson('"text"')).toBeNull();
  });

  it('未知のidや文字列以外の値は無視される', () => {
    const json = JSON.stringify({ b1: 'ok', unknown: 'x', b2: 123 });
    const result = importJson(json);
    expect(result?.b1).toBe('ok');
    expect(result).not.toHaveProperty('unknown');
    expect(result?.b2).toBe('');
  });

  it('欠けているidは空文字で補完される', () => {
    const json = JSON.stringify({ b1: 'ok' });
    const result = importJson(json);
    expect(result?.b2).toBe('');
    expect(Object.keys(result ?? {}).sort()).toEqual(BOXES.map(b => b.id).sort());
  });
});

describe('tickForConnection', () => {
  it('水平線の中点における垂直な短い線分を返す', () => {
    const from = { id: 'a', x: 0, y: 10 };
    const to = { id: 'b', x: 20, y: 10 };
    const tick = tickForConnection(from, to, 2);
    expect(tick.x1).toBeCloseTo(10);
    expect(tick.x2).toBeCloseTo(10);
    expect(tick.y1).toBeCloseTo(8);
    expect(tick.y2).toBeCloseTo(12);
  });

  it('垂直線の中点における水平な短い線分を返す', () => {
    const from = { id: 'a', x: 10, y: 0 };
    const to = { id: 'b', x: 10, y: 20 };
    const tick = tickForConnection(from, to, 2);
    expect(tick.y1).toBeCloseTo(10);
    expect(tick.y2).toBeCloseTo(10);
    expect([tick.x1, tick.x2].sort((a, b) => a - b)).toEqual([8, 12]);
  });
});

describe('arrowHeadPoints', () => {
  it('3点分の座標を含むpoints文字列を返す', () => {
    const from = { id: 'a', x: 0, y: 0 };
    const to = { id: 'b', x: 20, y: 0 };
    const points = arrowHeadPoints(from, to, 3, 2, 1);
    const coords = points.trim().split(/\s+/);
    expect(coords).toHaveLength(3);
  });

  it('先端(tip)がfrom→to方向の直線上にあり、to側にinset分だけ寄っている', () => {
    const from = { id: 'a', x: 0, y: 0 };
    const to = { id: 'b', x: 20, y: 0 };
    const points = arrowHeadPoints(from, to, 3, 2, 1);
    const [tip] = points.trim().split(/\s+/).map(p => p.split(',').map(Number));
    expect(tip[0]).toBeCloseTo(17);
    expect(tip[1]).toBeCloseTo(0);
  });
});

describe('sanitizeFileName', () => {
  it('空文字のときデフォルト名を返す', () => {
    expect(sanitizeFileName('')).toBe('symtree');
  });

  it('空白のみのときデフォルト名を返す', () => {
    expect(sanitizeFileName('   ')).toBe('symtree');
  });

  it('前後の空白を取り除く', () => {
    expect(sanitizeFileName('  my-tree  ')).toBe('my-tree');
  });

  it('ファイル名に使えない文字を除去する', () => {
    expect(sanitizeFileName('my/tree:name*?"<>|')).toBe('mytreename');
  });

  it('日本語はそのまま使える', () => {
    expect(sanitizeFileName('生命の樹')).toBe('生命の樹');
  });
});

describe('checkKotoba', () => {
  it('正しい合言葉でtrueを返す', () => {
    expect(checkKotoba('seimei')).toBe(true);
  });

  it('間違った合言葉でfalseを返す', () => {
    expect(checkKotoba('wrong')).toBe(false);
  });

  it('大文字小文字を区別する', () => {
    expect(checkKotoba('SEIMEI')).toBe(false);
  });
});

describe('isAuthValid', () => {
  it('authUntilがnullのときfalse', () => {
    expect(isAuthValid(null, Date.now())).toBe(false);
  });

  it('現在時刻がauthUntilより前ならtrue', () => {
    const now = 1000;
    expect(isAuthValid(2000, now)).toBe(true);
  });

  it('現在時刻がauthUntilを過ぎたらfalse', () => {
    const now = 3000;
    expect(isAuthValid(2000, now)).toBe(false);
  });
});

describe('nextAuthUntil', () => {
  it('現在時刻から2週間後のタイムスタンプを返す', () => {
    const now = 1000;
    expect(nextAuthUntil(now)).toBe(now + AUTH_DURATION_MS);
  });

  it('2週間はミリ秒換算で14日分になる', () => {
    expect(AUTH_DURATION_MS).toBe(14 * 24 * 60 * 60 * 1000);
  });
});