import { describe, it, expect } from 'vitest';
import { parseEntries, buildSummary, fmtTimestamp, assignAssigneeColors } from './nippoCore';

describe('parseEntries', () => {
  it('空の入力は空配列を返す', () => {
    expect(parseEntries('')).toEqual([]);
  });

  it('・で始まらない行は無視される', () => {
    expect(parseEntries('タスク一覧\nメモ')).toEqual([]);
  });

  it('時刻なし・ステータスなしの行はpendingで返る', () => {
    expect(parseEntries('・会議')).toEqual([
      { label: '会議', startMin: null, endMin: null, status: 'pending', now: false, assignee: null },
    ]);
  });

  it('HH:MM~HH:MMをstartMin/endMinに変換する', () => {
    expect(parseEntries('・朝会 9:00~9:30')).toEqual([
      { label: '朝会', startMin: 540, endMin: 570, status: 'pending', now: false, assignee: null },
    ]);
  });

  it('行末の「完了」でステータスがcompletedになる', () => {
    expect(parseEntries('・朝会 9:00~9:30 完了')).toEqual([
      { label: '朝会', startMin: 540, endMin: 570, status: 'completed', now: false, assignee: null },
    ]);
  });

  it('行末の「進行中」でステータスがin-progressになる', () => {
    expect(parseEntries('・設計 10:00~11:30 進行中')).toEqual([
      { label: '設計', startMin: 600, endMin: 690, status: 'in-progress', now: false, assignee: null },
    ]);
  });

  it('時刻なし・「完了」ありの行も正しく解析される', () => {
    expect(parseEntries('・レビュー 完了')).toEqual([
      { label: 'レビュー', startMin: null, endMin: null, status: 'completed', now: false, assignee: null },
    ]);
  });

  it('行末の「未着手」はキーワードとして除去される（ステータスはpendingのまま）', () => {
    expect(parseEntries('・朝かい 10:00~12:22 未着手')).toEqual([
      { label: '朝かい', startMin: 600, endMin: 742, status: 'pending', now: false, assignee: null },
    ]);
  });

  it('時刻なしの「未着手」もラベルから除去される', () => {
    expect(parseEntries('・タスク 未着手')).toEqual([
      { label: 'タスク', startMin: null, endMin: null, status: 'pending', now: false, assignee: null },
    ]);
  });

  it('複数行をすべて解析する', () => {
    const input = '・朝会 9:00~9:30 完了\n・設計 10:00~11:30 進行中\n・テスト';
    expect(parseEntries(input)).toEqual([
      { label: '朝会', startMin: 540, endMin: 570, status: 'completed', now: false, assignee: null },
      { label: '設計', startMin: 600, endMin: 690, status: 'in-progress', now: false, assignee: null },
      { label: 'テスト', startMin: null, endMin: null, status: 'pending', now: false, assignee: null },
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

  it('行末の「保留」でステータスがdeferredになる', () => {
    expect(parseEntries('・企画書 保留')).toEqual([
      { label: '企画書', startMin: null, endMin: null, status: 'deferred', now: false, assignee: null },
    ]);
  });

  it('時刻ありの「保留」も正しく解析される', () => {
    const [e] = parseEntries('・企画書 10:00~11:00 保留');
    expect(e.status).toBe('deferred');
    expect(e.label).toBe('企画書');
  });

  it('{担当:名前}で担当者が設定される', () => {
    const [e] = parseEntries('・朝会 完了 {担当:田中}');
    expect(e.assignee).toBe('田中');
    expect(e.label).toBe('朝会');
  });

  it('{担当:名前}がない場合はnullになる', () => {
    const [e] = parseEntries('・朝会 完了');
    expect(e.assignee).toBeNull();
  });

  it('{担当:名前}はラベルにもステータス判定にも影響しない', () => {
    const [e] = parseEntries('・レビュー 進行中 {担当:鈴木}');
    expect(e.label).toBe('レビュー');
    expect(e.status).toBe('in-progress');
    expect(e.assignee).toBe('鈴木');
  });

  it('{担当}と{now}が両方あっても正しく解析される', () => {
    const [e] = parseEntries('・設計 進行中 {担当:佐藤} {now}');
    expect(e.assignee).toBe('佐藤');
    expect(e.now).toBe(true);
    expect(e.label).toBe('設計');
  });
});

describe('buildSummary', () => {
  it('エントリがなくても全グループがタイムスタンプと一緒に出力される', () => {
    const result = buildSummary([], '07/01 01:11');
    expect(result).toContain('07/01 01:11');
    expect(result).toContain('【未着手】');
    expect(result).toContain('【保留】');
    expect(result).toContain('【進行中】');
    expect(result).toContain('【完了】');
  });

  it('完了→進行中→保留→未着手の順でグループが出力される', () => {
    const entries = [
      { label: '朝会', startMin: 540, endMin: 570, status: 'completed' as const, now: false, assignee: null },
      { label: '設計', startMin: 600, endMin: 690, status: 'in-progress' as const, now: false, assignee: null },
      { label: '企画書', startMin: null, endMin: null, status: 'deferred' as const, now: false, assignee: null },
      { label: 'テスト', startMin: null, endMin: null, status: 'pending' as const, now: false, assignee: null },
    ];
    const result = buildSummary(entries, '07/01 01:11');
    const idxCompleted = result.indexOf('【完了】');
    const idxInProgress = result.indexOf('【進行中】');
    const idxDeferred = result.indexOf('【保留】');
    const idxPending = result.indexOf('【未着手】');
    expect(idxCompleted).toBeLessThan(idxInProgress);
    expect(idxInProgress).toBeLessThan(idxDeferred);
    expect(idxDeferred).toBeLessThan(idxPending);
    expect(result).toContain('・朝会');
    expect(result).toContain('・設計');
    expect(result).toContain('・企画書');
    expect(result).toContain('・テスト');
  });

  it('時刻はコピーに含まれない', () => {
    const entries = [
      { label: '朝会', startMin: 540, endMin: 570, status: 'completed' as const, now: false, assignee: null },
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

  it('コードフェンス(```)では囲まれない', () => {
    const result = buildSummary([], '07/01 13:45');
    expect(result).not.toContain('```');
  });

  it('日付の行の先頭に【タスク】が付く', () => {
    const result = buildSummary([], '07/01 13:45');
    expect(result).toContain('【タスク】07/01 13:45');
  });

  it('nowのエントリがあってもサマリに【作業中】セクションは出力されない', () => {
    const entries = [
      { label: '朝会', startMin: 540, endMin: 570, status: 'completed' as const, now: false, assignee: null },
      { label: '設計', startMin: 600, endMin: 690, status: 'in-progress' as const, now: true, assignee: null },
    ];
    const result = buildSummary(entries, '07/01 01:11');
    expect(result).not.toContain('【作業中】');
    expect(result).toContain('・設計');
  });

  it('nowのエントリがない場合も同様に出力しない', () => {
    const entries = [
      { label: '朝会', startMin: 540, endMin: 570, status: 'completed' as const, now: false, assignee: null },
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

describe('assignAssigneeColors', () => {
  it('初出順にパレットの色を先頭から割り当てる', () => {
    const colors = assignAssigneeColors(['田中', '鈴木', '田中'], false);
    expect(colors['田中']).not.toBe(colors['鈴木']);
    expect(Object.keys(colors)).toEqual(['田中', '鈴木']);
  });

  it('darkフラグでライト/ダーク用の色が変わる', () => {
    const light = assignAssigneeColors(['田中'], false);
    const dark = assignAssigneeColors(['田中'], true);
    expect(light['田中']).not.toBe(dark['田中']);
  });

  it('パレット数を超えても全員に色を割り当てる', () => {
    const names = Array.from({ length: 12 }, (_, i) => `担当${i}`);
    const colors = assignAssigneeColors(names, false);
    expect(Object.keys(colors)).toHaveLength(12);
  });
});