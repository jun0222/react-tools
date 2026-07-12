import { describe, it, expect } from 'vitest';
import { parseEntries, buildSummary, fmtTimestamp, assignRepoColors } from './githubhubCore';

describe('parseEntries', () => {
  it('空の入力は空配列を返す', () => {
    expect(parseEntries('')).toEqual([]);
  });

  it('・で始まらない行は無視される', () => {
    expect(parseEntries('メモ\nタスク一覧')).toEqual([]);
  });

  it('URLのみの行はdraft扱いでタイトルなしになる', () => {
    expect(parseEntries('・https://github.com/org/repo/pull/123')).toEqual([
      { url: 'https://github.com/org/repo/pull/123', number: 123, status: 'draft', title: '', dependsOn: null, repo: 'repo', now: false },
    ]);
  });

  it('URLからリポジトリ名を抽出する', () => {
    const [e] = parseEntries('・https://github.com/acme/webapp/pull/45 open');
    expect(e.repo).toBe('webapp');
  });

  it('URL + ステータスが反映される', () => {
    const [e] = parseEntries('・https://github.com/org/repo/pull/45 open');
    expect(e.status).toBe('open');
    expect(e.number).toBe(45);
  });

  it('URL + ステータス + タイトルが反映される', () => {
    const [e] = parseEntries('・https://github.com/org/repo/pull/45 review1 ログイン修正');
    expect(e.status).toBe('review1');
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

  it('fix1/review2/fix2も解釈できる', () => {
    expect(parseEntries('・https://github.com/org/repo/pull/1 fix1')[0].status).toBe('fix1');
    expect(parseEntries('・https://github.com/org/repo/pull/2 review2')[0].status).toBe('review2');
    expect(parseEntries('・https://github.com/org/repo/pull/3 fix2')[0].status).toBe('fix2');
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

  it('行末の{now}で作業中フラグがtrueになる', () => {
    const [e] = parseEntries('・https://github.com/org/repo/pull/1 open タイトル {now}');
    expect(e.now).toBe(true);
    expect(e.title).toBe('タイトル');
  });

  it('{now}がない場合はfalseになる', () => {
    const [e] = parseEntries('・https://github.com/org/repo/pull/1 open');
    expect(e.now).toBe(false);
  });

  it('{依存}と{now}が両方あっても正しく解析される', () => {
    const [e] = parseEntries('・https://github.com/org/repo/pull/1 open タイトル {依存:#5} {now}');
    expect(e.dependsOn).toBe(5);
    expect(e.now).toBe(true);
    expect(e.title).toBe('タイトル');
  });
});

describe('buildSummary', () => {
  it('エントリがなくても全ステータスがタイムスタンプと一緒に出力される', () => {
    const result = buildSummary([], '07/08 12:00');
    expect(result).toContain('07/08 12:00');
    expect(result).toContain('【Draft】');
    expect(result).toContain('【Open】');
    expect(result).toContain('【1次レビューまち】');
    expect(result).toContain('【1次修正中】');
    expect(result).toContain('【2次レビューまち】');
    expect(result).toContain('【2次修正中】');
    expect(result).toContain('【Merged】');
  });

  it('merged→fix2→review2→fix1→review1→open→draftの順で出力される', () => {
    const mk = (n: number, status: Parameters<typeof buildSummary>[0][number]['status']) =>
      ({ url: `u${n}`, number: n, status, title: '', dependsOn: null, repo: 'r', now: false });
    const entries = [
      mk(1, 'draft'), mk(2, 'open'), mk(3, 'review1'), mk(4, 'fix1'),
      mk(5, 'review2'), mk(6, 'fix2'), mk(7, 'merged'),
    ];
    const result = buildSummary(entries, '07/08 12:00');
    const idx = (label: string) => result.indexOf(label);
    expect(idx('【Merged】')).toBeLessThan(idx('【2次修正中】'));
    expect(idx('【2次修正中】')).toBeLessThan(idx('【2次レビューまち】'));
    expect(idx('【2次レビューまち】')).toBeLessThan(idx('【1次修正中】'));
    expect(idx('【1次修正中】')).toBeLessThan(idx('【1次レビューまち】'));
    expect(idx('【1次レビューまち】')).toBeLessThan(idx('【Open】'));
    expect(idx('【Open】')).toBeLessThan(idx('【Draft】'));
  });

  it('タイトルがある場合は番号とタイトルが両方出力される', () => {
    const entries = [
      { url: 'u1', number: 5, status: 'open' as const, title: 'ログイン修正', dependsOn: null, repo: 'r', now: false },
    ];
    const result = buildSummary(entries, '07/08 12:00');
    expect(result).toContain('・#5 ログイン修正');
  });

  it('タイトルがない場合は番号のみ出力される', () => {
    const entries = [
      { url: 'u1', number: 5, status: 'open' as const, title: '', dependsOn: null, repo: 'r', now: false },
    ];
    const result = buildSummary(entries, '07/08 12:00');
    expect(result).toContain('・#5');
    expect(result).not.toContain('・#5 ');
  });

  it('nowのエントリがあってもサマリに【作業中】セクションは出力されない', () => {
    const entries = [
      { url: 'u1', number: 1, status: 'open' as const, title: '', dependsOn: null, repo: 'r', now: false },
      { url: 'u2', number: 2, status: 'fix1' as const, title: '修正対応', dependsOn: null, repo: 'r', now: true },
    ];
    const result = buildSummary(entries, '07/08 12:00');
    expect(result).not.toContain('【作業中】');
    expect(result).toContain('・#2 修正対応');
  });

  it('nowのエントリがない場合も同様に出力しない', () => {
    const entries = [
      { url: 'u1', number: 1, status: 'open' as const, title: '', dependsOn: null, repo: 'r', now: false },
    ];
    const result = buildSummary(entries, '07/08 12:00');
    expect(result).not.toContain('【作業中】');
  });
});

describe('fmtTimestamp', () => {
  it('MM/DD(曜) HH:mm 形式で返す（2026-07-08は水曜日）', () => {
    expect(fmtTimestamp(new Date(2026, 6, 8, 9, 5))).toBe('07/08(水) 09:05');
  });
});

describe('assignRepoColors', () => {
  it('初出順にパレットの色を先頭から割り当てる', () => {
    const colors = assignRepoColors(['webapp', 'api', 'webapp'], false);
    expect(colors.webapp).not.toBe(colors.api);
    expect(Object.keys(colors)).toEqual(['webapp', 'api']);
  });

  it('同じリポジトリには常に同じ色が割り当てられる', () => {
    const colors = assignRepoColors(['webapp', 'api', 'webapp'], false);
    expect(colors.webapp).toBeDefined();
  });

  it('darkフラグでライト/ダーク用の色が変わる', () => {
    const light = assignRepoColors(['webapp'], false);
    const dark = assignRepoColors(['webapp'], true);
    expect(light.webapp).not.toBe(dark.webapp);
  });

  it('パレット数を超えても全リポジトリに色を割り当てる', () => {
    const repos = Array.from({ length: 12 }, (_, i) => `repo${i}`);
    const colors = assignRepoColors(repos, false);
    expect(Object.keys(colors)).toHaveLength(12);
    expect(colors.repo0).toBeDefined();
    expect(colors.repo11).toBeDefined();
  });
});