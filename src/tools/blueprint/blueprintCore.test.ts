import { describe, it, expect } from 'vitest';
import { exportToMarkdown, DEFAULT_NFRS, DEFAULT_STRATEGIES } from './blueprintCore';
import type { BlueprintData } from './blueprintCore';

const base: BlueprintData = {
  featureName: 'ログイン機能',
  description: '',
  funcReqs: [],
  testCases: [],
  nfrs: [],
  strategies: [],
};

describe('exportToMarkdown', () => {
  it('機能名をH1で出力する', () => {
    const result = exportToMarkdown({ ...base, featureName: 'ログイン機能' });
    expect(result).toContain('# ログイン機能');
  });

  it('機能名が空のときプレースホルダーを出力する', () => {
    const result = exportToMarkdown({ ...base, featureName: '' });
    expect(result).toContain('# （機能名未入力）');
  });

  it('説明文がある場合に含める', () => {
    const result = exportToMarkdown({ ...base, description: 'ユーザーがログインできる' });
    expect(result).toContain('ユーザーがログインできる');
  });

  it('機能要件をMustラベル付きで出力する', () => {
    const result = exportToMarkdown({
      ...base,
      funcReqs: [{ id: '1', text: 'メールでログインできる', priority: 'must' }],
    });
    expect(result).toContain('[Must]');
    expect(result).toContain('メールでログインできる');
  });

  it('機能要件がないとき（未入力）を出力する', () => {
    const result = exportToMarkdown({ ...base, funcReqs: [] });
    expect(result).toContain('（未入力）');
  });

  it('正常系テストケースをテーブルで出力する', () => {
    const result = exportToMarkdown({
      ...base,
      testCases: [{ id: '1', name: 'ログイン成功', input: '正常なメール+PW', expected: 'ダッシュボードへ遷移', kind: 'normal' }],
    });
    expect(result).toContain('### 正常系');
    expect(result).toContain('ログイン成功');
    expect(result).toContain('正常なメール+PW');
  });

  it('異常系テストケースを別セクションで出力する', () => {
    const result = exportToMarkdown({
      ...base,
      testCases: [{ id: '1', name: '無効なPW', input: '間違ったPW', expected: 'エラーメッセージ', kind: 'error' }],
    });
    expect(result).toContain('### 異常系');
  });

  it('チェック済みNFRに[x]を付ける', () => {
    const result = exportToMarkdown({
      ...base,
      nfrs: [{ id: '1', label: 'パフォーマンス', checked: true, note: '' }],
    });
    expect(result).toContain('[x] **パフォーマンス**');
  });

  it('未チェックNFRに[ ]を付ける', () => {
    const result = exportToMarkdown({
      ...base,
      nfrs: [{ id: '1', label: 'セキュリティ', checked: false, note: '' }],
    });
    expect(result).toContain('[ ] **セキュリティ**');
  });

  it('NFRのノートを含める', () => {
    const result = exportToMarkdown({
      ...base,
      nfrs: [{ id: '1', label: 'パフォーマンス', checked: true, note: '3秒以内に応答' }],
    });
    expect(result).toContain('3秒以内に応答');
  });

  it('チェック済み戦略に[x]を付ける', () => {
    const result = exportToMarkdown({
      ...base,
      strategies: [{ id: '1', label: '振る舞いをテストする', checked: true }],
    });
    expect(result).toContain('[x] 振る舞いをテストする');
  });

  it('DEFAULT_NFRSが8項目ある', () => {
    expect(DEFAULT_NFRS).toHaveLength(8);
  });

  it('DEFAULT_STRATEGIESが9項目ある', () => {
    expect(DEFAULT_STRATEGIES).toHaveLength(9);
  });
});