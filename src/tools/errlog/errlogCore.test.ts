import { describe, it, expect, beforeEach } from 'vitest';
import {
  createRecord, addRecord, deleteRecord, filterRecords,
  generatePrompt, extractMermaid, loadRecords, saveRecords,
} from './errlogCore';
import type { ErrorRecord } from './errlogCore';

describe('createRecord', () => {
  it('フィールドが正しく設定される', () => {
    const r = createRecord('TypeError: foo', 'テストエラー', 'LLMの返答');
    expect(r.errorText).toBe('TypeError: foo');
    expect(r.title).toBe('テストエラー');
    expect(r.response).toBe('LLMの返答');
    expect(r.id).toMatch(/^el-/);
    expect(r.createdAt).toBeTruthy();
  });

  it('タイトルが空のときエラー文の先頭60文字をタイトルにする', () => {
    const r = createRecord('TypeError: cannot read property of undefined', '', '');
    expect(r.title).toBe('TypeError: cannot read property of undefined');
  });

  it('タイトルが空でエラー文が長いとき60文字で切る', () => {
    const longError = 'E'.repeat(80);
    const r = createRecord(longError, '', '');
    expect(r.title).toHaveLength(60);
  });

  it('タイトルの改行はスペースに変換される', () => {
    const r = createRecord('line1\nline2', '', '');
    expect(r.title).not.toContain('\n');
  });

  it('タイトルの前後の空白はトリムされる', () => {
    const r = createRecord('err', '  My Error  ', '');
    expect(r.title).toBe('My Error');
  });
});

describe('addRecord', () => {
  it('リストの先頭に追加される', () => {
    const r1 = createRecord('err1', 'A', '');
    const r2 = createRecord('err2', 'B', '');
    const list = addRecord([r1], r2);
    expect(list[0]).toBe(r2);
    expect(list[1]).toBe(r1);
  });
});

describe('deleteRecord', () => {
  it('指定した id のレコードを削除できる', () => {
    const r1 = createRecord('a', 'A', '');
    const r2 = createRecord('b', 'B', '');
    const list = deleteRecord([r1, r2], r1.id);
    expect(list).toHaveLength(1);
    expect(list[0]).toBe(r2);
  });

  it('存在しない id は無視される', () => {
    const r = createRecord('a', 'A', '');
    expect(deleteRecord([r], 'no-such-id')).toHaveLength(1);
  });
});

describe('filterRecords', () => {
  let items: ErrorRecord[];
  beforeEach(() => {
    items = [
      createRecord('TypeError: Cannot read properties of null', 'nullエラー', ''),
      createRecord('SQLSTATE[42000]: Syntax error', 'SQLエラー', 'SELECT * FROM'),
      createRecord('npm ERR! 404 Not Found', 'npmエラー', ''),
    ];
  });

  it('空クエリは全件返す', () => {
    expect(filterRecords(items, '')).toHaveLength(3);
  });

  it('タイトルで検索できる', () => {
    expect(filterRecords(items, 'sql')).toHaveLength(1);
  });

  it('エラーテキストで検索できる', () => {
    expect(filterRecords(items, 'TypeError')).toHaveLength(1);
  });

  it('レスポンスで検索できる', () => {
    expect(filterRecords(items, 'SELECT')).toHaveLength(1);
  });

  it('大文字小文字を無視する', () => {
    expect(filterRecords(items, 'TYPEERROR')).toHaveLength(1);
  });

  it('マッチしないクエリは空配列を返す', () => {
    expect(filterRecords(items, 'zzzzzzz')).toHaveLength(0);
  });
});

describe('generatePrompt', () => {
  it('エラー内容が含まれる', () => {
    const prompt = generatePrompt('TypeError: foo is not defined');
    expect(prompt).toContain('TypeError: foo is not defined');
  });

  it('mermaid flowchart の指示が含まれる', () => {
    const prompt = generatePrompt('some error');
    expect(prompt).toContain('mermaid');
    expect(prompt).toContain('flowchart TD');
  });

  it('コードブロックの指示が含まれる', () => {
    const prompt = generatePrompt('some error');
    expect(prompt).toContain('```bash');
  });

  it('解決策セクションが含まれる', () => {
    const prompt = generatePrompt('some error');
    expect(prompt).toContain('解決策');
  });
});

describe('extractMermaid', () => {
  it('mermaidブロックを抽出できる', () => {
    const response = 'some text\n```mermaid\nflowchart TD\n  A --> B\n```\nmore text';
    expect(extractMermaid(response)).toBe('flowchart TD\n  A --> B');
  });

  it('mermaidブロックがない場合はnullを返す', () => {
    expect(extractMermaid('no mermaid here')).toBeNull();
  });

  it('先頭と末尾の空白をトリムする', () => {
    const response = '```mermaid\n  flowchart TD\n  A --> B\n  \n```';
    const result = extractMermaid(response);
    expect(result).toBe('flowchart TD\n  A --> B');
  });
});

describe('loadRecords / saveRecords', () => {
  beforeEach(() => { localStorage.clear(); });

  it('何もない状態では空配列を返す', () => {
    expect(loadRecords()).toEqual([]);
  });

  it('保存したレコードを読み込める', () => {
    const r = createRecord('err', 'title', 'resp');
    saveRecords([r]);
    const loaded = loadRecords();
    expect(loaded).toHaveLength(1);
    expect(loaded[0].errorText).toBe('err');
  });
});
