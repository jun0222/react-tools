import { describe, it, expect } from 'vitest';
import { buildCode } from './fishboneCore';
import type { FishboneData } from './fishboneCore';

const minimal: FishboneData = { effect: '品質低下', categories: [] };

describe('buildCode', () => {
  it('ishikawaキーワードで始まる', () => {
    expect(buildCode(minimal).startsWith('ishikawa')).toBe(true);
  });

  it('効果をクォートして出力する', () => {
    expect(buildCode(minimal)).toContain('"品質低下"');
  });

  it('カテゴリを出力する', () => {
    const data: FishboneData = {
      effect: 'E',
      categories: [{ id: 'c1', name: '人', causes: [] }],
    };
    expect(buildCode(data)).toContain('"人"');
  });

  it('原因をカテゴリより深くインデントする', () => {
    const data: FishboneData = {
      effect: 'E',
      categories: [{ id: 'c1', name: '人', causes: [{ id: 'ca1', text: '経験不足' }] }],
    };
    const lines = buildCode(data).split('\n');
    const catLine   = lines.find(l => l.includes('"人"'))!;
    const causeLine = lines.find(l => l.includes('"経験不足"'))!;
    const catIndent   = catLine.match(/^ */)?.[0].length ?? 0;
    const causeIndent = causeLine.match(/^ */)?.[0].length ?? 0;
    expect(causeIndent).toBeGreaterThan(catIndent);
  });

  it('ダブルクォートをシングルクォートにエスケープする', () => {
    const data: FishboneData = {
      effect: 'E "test"',
      categories: [],
    };
    expect(buildCode(data)).toContain("\"E 'test'\"");
  });

  it('複数カテゴリ・複数原因を出力する', () => {
    const data: FishboneData = {
      effect: 'バグ',
      categories: [
        { id: 'c1', name: '方法', causes: [{ id: 'ca1', text: 'レビュー不足' }] },
        { id: 'c2', name: '機械', causes: [{ id: 'ca2', text: 'ツール不足' }, { id: 'ca3', text: '設定ミス' }] },
      ],
    };
    const code = buildCode(data);
    expect(code).toContain('"方法"');
    expect(code).toContain('"機械"');
    expect(code).toContain('"レビュー不足"');
    expect(code).toContain('"ツール不足"');
    expect(code).toContain('"設定ミス"');
  });
});
