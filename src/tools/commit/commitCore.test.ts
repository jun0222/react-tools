import { describe, it, expect } from 'vitest';
import {
  formatCommit,
  addToHistory,
  exportHistoryJson,
  importHistoryJson,
} from './commitCore';

// ---- formatCommit ----

describe('formatCommit', () => {
  it('type・scope・descが揃うと type(scope): desc 形式', () => {
    expect(formatCommit('feat', 'auth', 'add login')).toBe('feat(auth): add login');
  });

  it('scopeが空のとき type: desc 形式', () => {
    expect(formatCommit('fix', '', 'null pointer')).toBe('fix: null pointer');
  });

  it('descが空のとき空文字', () => {
    expect(formatCommit('feat', 'ui', '')).toBe('');
  });

  it('typeが空のとき空文字', () => {
    expect(formatCommit('', 'ui', 'add button')).toBe('');
  });

  it('スペースのみのscopeは無視される', () => {
    expect(formatCommit('chore', '   ', 'update deps')).toBe('chore: update deps');
  });
});

// ---- addToHistory ----

describe('addToHistory', () => {
  it('新しい値が先頭に追加される', () => {
    expect(addToHistory(['fix'], 'feat')).toEqual(['feat', 'fix']);
  });

  it('既存の値は重複せず先頭に移動する', () => {
    expect(addToHistory(['feat', 'fix', 'chore'], 'fix')).toEqual(['fix', 'feat', 'chore']);
  });

  it('空文字は追加されない', () => {
    expect(addToHistory(['feat'], '')).toEqual(['feat']);
  });

  it('スペースのみは追加されない', () => {
    expect(addToHistory(['feat'], '   ')).toEqual(['feat']);
  });

  it('最大件数を超えた分は切り捨てられる', () => {
    const hist = ['a', 'b', 'c', 'd', 'e'];
    expect(addToHistory(hist, 'f', 5)).toHaveLength(5);
    expect(addToHistory(hist, 'f', 5)[0]).toBe('f');
  });

  it('デフォルト最大件数は20', () => {
    const hist = Array.from({ length: 20 }, (_, i) => String(i));
    expect(addToHistory(hist, 'new')).toHaveLength(20);
  });
});

// ---- exportHistoryJson / importHistoryJson ----

describe('exportHistoryJson', () => {
  it('types・scopes・descsを含むJSONを返す', () => {
    const json = exportHistoryJson(['feat'], ['auth'], ['add login']);
    const obj = JSON.parse(json);
    expect(obj.types).toEqual(['feat']);
    expect(obj.scopes).toEqual(['auth']);
    expect(obj.descs).toEqual(['add login']);
  });
});

describe('importHistoryJson', () => {
  it('正しいJSONからhistoryを復元する', () => {
    const json = JSON.stringify({ types: ['feat'], scopes: ['ui'], descs: ['add btn'] });
    const result = importHistoryJson(json);
    expect(result).not.toBeNull();
    expect(result!.types).toEqual(['feat']);
    expect(result!.scopes).toEqual(['ui']);
    expect(result!.descs).toEqual(['add btn']);
  });

  it('不正なJSONはnullを返す', () => {
    expect(importHistoryJson('not json')).toBeNull();
  });

  it('フィールドが欠けていてもnullを返さず空配列で補完する', () => {
    const result = importHistoryJson(JSON.stringify({ types: ['feat'] }));
    expect(result).not.toBeNull();
    expect(result!.scopes).toEqual([]);
    expect(result!.descs).toEqual([]);
  });
});
