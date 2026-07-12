import { describe, it, expect } from 'vitest';
import { parseEntries, buildSummary, fmtTimestamp } from './nippoCore';

describe('parseEntries', () => {
  it('空の入力は空配列を返す', () => {
    expect(parseEntries('')).toEqual([]);
  });

  it('・で始まらない行は無視される', () => {
    expect(parseEntries('タスク一覧\nメモ')).toEqual([]);
  });

  it('時刻なし・ステータスなしの行はpendingで返る', () => {
    expect(parseEntries('・会議')).toEqual([
      { label: '会議', startMin: null, endMin: null, status: 'pending', now: false },
    ]);
  });

  it('HH:MM~HH:MMをstartMin/endMinに変換する', () => {
    expect(parseEntries('・朝会 9:00~9:30')).toEqual([
      { label: '朝会', startMin: 540, endMin: 570, status: 'pending', now: false },
    ]);
  });

  it('行末の「完了」でステータスがcompletedになる', () => {
    expect(parseEntries('・朝会 9:00~9:30 完了')).toEqual([
      { label: '朝会', startMin: 540, endMin: 570, status: 'completed', now: false },
    ]);
  });

  it('行末の「進行中」でステータスがin-progressになる', () => {
    expect(parseEntries('・設計 10:00~11:30 進行中')).toEqual([
      { label: '設計', startMin: 600, endMin: 690, status: 'in-progress', now: false },
    ]);
  });

  it('時刻なし・「完了」ありの行も正しく解析される', () => {
    expect(parseEntries('・レビュー 完了')).toEqual([
      { label: 'レビュー', startMin: null, endMin: null, status: 'completed', now: false },
    ]);
  });

  it('行末の「未着手」はキーワードとして除去される（ステータスはpendingのまま）', () => {
    expect(parseEntries('・朝かい 10:00~12:22 未着手')).toEqual([
      { label: '朝かい', startMin: 600, endMin: 742, status: 'pending', now: false },
    ]);
  });

  it('時刻なしの「未着手」もラベルから除去される', () => {
    expect(parseEntries('・タスク 未着手')).toEqual([
      { label: 'タスク', startMin: null, endMin: null, status: 'pending', now: false },
    ]);
  });

  it('複数行をすべて解析する', () => {
    const input = '・朝会 9:00~9:30 完了\n・設計 10:00~11:30 進行中\n・テスト';
    expect(parseEntries(input)).toEqual([
      { label: '朝会', startMin: 540, endMin: 570, status: 'completed', now: false },
      { label: '設計', startMin: 600, endMin: 690, status: 'in-progress', now: false },
      { label: 'テスト', startMin: null, endMin: null, status: 'pending', now: false },
    ]);
  });

  it('・以外の行が混在してもスキップされる', () => {
    const input = '今日のタスク\n・朝会 9:00~9:30\n---\n・夕会';
    expect(parseEntries(input)).toHaveLength(2);
  });

  it('行末の{now}で作業中フラグがtrueになる', () => {
    const [e] = parseEntries('・設計 10:00~11:30 進行中 {now}');
    expect(e.now).toBe(true);
    expect(e.label).toBe('設計');
  });

  it('{now}がない場合はfalseになる', () => {
    const [e] = parseEntries('・設計 進行中');
    expect(e.now).toBe(false);
  });

  it('{now}はラベルにもステータス判定にも影響しない', () => {
    const [e] = parseEntries('・レビュー 完了 {now}');
    expect(e.label).toBe('レビュー');
    expect(e.status).toBe('completed');
    expect(e.now).toBe(true);
  });
});

describe('buildSummary', () => {
  it('エントリがなくても全グループがタイムスタンプと一緒に出力される', () => {
    const result = buildSummary([], '07/01 01:11');
    expect(result).toContain('07/01 01:11');
    expect(result).toContain('【未着手】');
    expect(result).toContain('【進行中】');
    expect(result).toContain('【完了】');
  });

  it('完了→進行中→未着手の順でグループが出力される', () => {
    const entries = [
      { label: '朝会', startMin: 540, endMin: 570, status: 'completed' as const, now: false },
      { label: '設計', startMin: 600, endMin: 690, status: 'in-progress' as const, now: false },
      { label: 'テスト', startMin: null, endMin: null, status: 'pending' as const, now: false },
    ];
    const result = buildSummary(entries, '07/01 01:11');
    const idxCompleted = result.indexOf('【完了】');
    const idxInProgress = result.indexOf('【進行中】');
    const idxPending = result.indexOf('【未着手】');
    expect(idxCompleted).toBeLessThan(idxInProgress);
    expect(idxInProgress).toBeLessThan(idxPending);
    expect(result).toContain('・朝会');
    expect(result).toContain('・設計');
    expect(result).toContain('・テスト');
  });

  it('時刻はコピーに含まれない', () => {
    const entries = [
      { label: '朝会', startMin: 540, endMin: 570, status: 'completed' as const, now: false },
    ];
    const result = buildSummary(entries, '07/01 01:11');
    expect(result).not.toContain('9:00');
    expect(result).not.toContain('9:30');
  });

  it('エントリがなくても全グループが出力される', () => {
    const result = buildSummary([], '07/01 01:11');
    expect(result).toContain('【完了】');
    expect(result).toContain('【進行中】');
    expect(result).toContain('【未着手】');
  });

  it('タイムスタンプがヘッダーに含まれる', () => {
    const result = buildSummary([], '07/01 13:45');
    expect(result).toContain('07/01 13:45');
  });

  it('nowのエントリがあってもサマリに【作業中】セクションは出力されない', () => {
    const entries = [
      { label: '朝会', startMin: 540, endMin: 570, status: 'completed' as const, now: false },
      { label: '設計', startMin: 600, endMin: 690, status: 'in-progress' as const, now: true },
    ];
    const result = buildSummary(entries, '07/01 01:11');
    expect(result).not.toContain('【作業中】');
    expect(result).toContain('・設計');
  });

  it('nowのエントリがない場合も同様に出力しない', () => {
    const entries = [
      { label: '朝会', startMin: 540, endMin: 570, status: 'completed' as const, now: false },
    ];
    const result = buildSummary(entries, '07/01 01:11');
    expect(result).not.toContain('【作業中】');
  });
});

describe('fmtTimestamp', () => {
  it('MM/DD(曜) HH:mm 形式で返す（2026-07-01は水曜日）', () => {
    expect(fmtTimestamp(new Date(2026, 6, 1, 23, 3))).toBe('07/01(水) 23:03');
  });

  it('月・日・時・分をゼロ埋めする', () => {
    expect(fmtTimestamp(new Date(2026, 0, 5, 9, 7))).toBe('01/05(月) 09:07');
  });
});