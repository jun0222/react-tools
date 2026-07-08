import { describe, it, expect } from 'vitest';
import { parseEntries, buildSummary, fmtTimestamp } from './githubhubCore';

describe('parseEntries', () => {
  it('空の入力は空配列を返す', () => {
    expect(parseEntries('')).toEqual([]);
  });

  it('・で始まらない行は無視される', () => {
    expect(parseEntries('メモ\nタスク一覧')).toEqual([]);
  });

  it('URLのみの行はdraft扱いでタイトルなしになる', () => {
    expect(parseEntries('・https://github.com/org/repo/pull/123')).toEqual([
      { url: 'https://github.com/org/repo/pull/123', number: 123, status: 'draft', title: '', dependsOn: null },
    ]);
  });

  it('URL + ステータスが反映される', () => {
    const [e] = parseEntries('・https://github.com/org/repo/pull/45 open');
    expect(e.status).toBe('open');
    expect(e.number).toBe(45);
  });

  it('URL + ステータス + タイトルが反映される', () => {
    const [e] = parseEntries('・https://github.com/org/repo/pull/45 review ログイン修正');
    expect(e.status).toBe('review');
    expect(e.title).toBe('ログイン修正');
  });

  it('依存指定 {依存:#N} が反映される', () => {
    const [e] = parseEntries('・https://github.com/org/repo/pull/45 open タイトル {依存:#40}');
    expect(e.dependsOn).toBe(40);
    expect(e.title).toBe('タイトル');
  });

  it('ステータス省略時はdraft扱いになる', () => {
    const [e] = parseEntries('・https://github.com/org/repo/pull/1 タイトルだけ');
    expect(e.status).toBe('draft');
    expect(e.title).toBe('タイトルだけ');
  });

  it('merged状態も解釈できる', () => {
    const [e] = parseEntries('・https://github.com/org/repo/pull/9 merged');
    expect(e.status).toBe('merged');
  });

  it('依存指定がない行はdependsOnがnullになる', () => {
    const [e] = parseEntries('・https://github.com/org/repo/pull/1 open');
    expect(e.dependsOn).toBeNull();
  });

  it('テキスト内の行順を保持する', () => {
    const entries = parseEntries(
      '・https://github.com/org/repo/pull/1 open\n・https://github.com/org/repo/pull/2 merged',
    );
    expect(entries.map(e => e.number)).toEqual([1, 2]);
  });
});

describe('buildSummary', () => {
  it('エントリがなくても全ステータスがタイムスタンプと一緒に出力される', () => {
    const result = buildSummary([], '07/08 12:00');
    expect(result).toContain('07/08 12:00');
    expect(result).toContain('【Draft】');
    expect(result).toContain('【Open】');
    expect(result).toContain('【Review中】');
    expect(result).toContain('【Merged】');
  });

  it('merged→review→open→draftの順で出力される', () => {
    const entries = [
      { url: 'u1', number: 1, status: 'draft' as const, title: '', dependsOn: null },
      { url: 'u2', number: 2, status: 'open' as const, title: '', dependsOn: null },
      { url: 'u3', number: 3, status: 'review' as const, title: '', dependsOn: null },
      { url: 'u4', number: 4, status: 'merged' as const, title: '', dependsOn: null },
    ];
    const result = buildSummary(entries, '07/08 12:00');
    const idxMerged = result.indexOf('【Merged】');
    const idxReview = result.indexOf('【Review中】');
    const idxOpen = result.indexOf('【Open】');
    const idxDraft = result.indexOf('【Draft】');
    expect(idxMerged).toBeLessThan(idxReview);
    expect(idxReview).toBeLessThan(idxOpen);
    expect(idxOpen).toBeLessThan(idxDraft);
  });

  it('タイトルがある場合は番号とタイトルが両方出力される', () => {
    const entries = [
      { url: 'u1', number: 5, status: 'open' as const, title: 'ログイン修正', dependsOn: null },
    ];
    const result = buildSummary(entries, '07/08 12:00');
    expect(result).toContain('・#5 ログイン修正');
  });

  it('タイトルがない場合は番号のみ出力される', () => {
    const entries = [
      { url: 'u1', number: 5, status: 'open' as const, title: '', dependsOn: null },
    ];
    const result = buildSummary(entries, '07/08 12:00');
    expect(result).toContain('・#5');
    expect(result).not.toContain('・#5 ');
  });
});

describe('fmtTimestamp', () => {
  it('MM/DD(曜) HH:mm 形式で返す（2026-07-08は水曜日）', () => {
    expect(fmtTimestamp(new Date(2026, 6, 8, 9, 5))).toBe('07/08(水) 09:05');
  });
});
