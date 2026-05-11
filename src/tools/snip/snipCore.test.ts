import { describe, it, expect, beforeEach } from 'vitest';
import {
  createSnippet, addSnippet, deleteSnippet,
  filterSnippets, displayTitle, loadSnippets, saveSnippets,
} from './snipCore';
import type { Snippet } from './snipCore';

describe('createSnippet', () => {
  it('テキストとタイトルでスニペットを生成できる', () => {
    const sn = createSnippet('hello world', 'My Snippet');
    expect(sn.text).toBe('hello world');
    expect(sn.title).toBe('My Snippet');
    expect(sn.id).toMatch(/^sn-/);
    expect(sn.createdAt).toBeTruthy();
  });

  it('タイトル省略時は空文字になる', () => {
    const sn = createSnippet('hello');
    expect(sn.title).toBe('');
  });

  it('タイトルの前後の空白はトリムされる', () => {
    const sn = createSnippet('hello', '  My Title  ');
    expect(sn.title).toBe('My Title');
  });
});

describe('addSnippet', () => {
  it('リストの先頭に追加される', () => {
    const sn1 = createSnippet('first');
    const sn2 = createSnippet('second');
    const list = addSnippet([sn1], sn2);
    expect(list[0]).toBe(sn2);
    expect(list[1]).toBe(sn1);
  });
});

describe('deleteSnippet', () => {
  it('指定した id のスニペットを削除できる', () => {
    const sn1 = createSnippet('a');
    const sn2 = createSnippet('b');
    const list = deleteSnippet([sn1, sn2], sn1.id);
    expect(list).toHaveLength(1);
    expect(list[0]).toBe(sn2);
  });

  it('存在しない id は無視される', () => {
    const sn = createSnippet('a');
    expect(deleteSnippet([sn], 'no-such-id')).toHaveLength(1);
  });
});

describe('filterSnippets', () => {
  let items: Snippet[];
  beforeEach(() => {
    items = [
      createSnippet('Hello World', 'Greeting'),
      createSnippet('SELECT * FROM users', 'SQL Query'),
      createSnippet('npm install typescript'),
    ];
  });

  it('空のクエリは全件返す', () => {
    expect(filterSnippets(items, '')).toHaveLength(3);
  });

  it('スペースのみのクエリは全件返す', () => {
    expect(filterSnippets(items, '   ')).toHaveLength(3);
  });

  it('タイトルで検索できる', () => {
    expect(filterSnippets(items, 'greeting')).toHaveLength(1);
  });

  it('テキストで検索できる', () => {
    expect(filterSnippets(items, 'SELECT')).toHaveLength(1);
  });

  it('大文字小文字を無視して検索する', () => {
    expect(filterSnippets(items, 'hello')).toHaveLength(1);
  });

  it('マッチしないクエリは空配列を返す', () => {
    expect(filterSnippets(items, 'zzzzzzz')).toHaveLength(0);
  });
});

describe('displayTitle', () => {
  it('タイトルがあればタイトルを返す', () => {
    const sn = createSnippet('some text', 'My Title');
    expect(displayTitle(sn)).toBe('My Title');
  });

  it('タイトルがなくテキストが40文字以内なら全テキストを返す', () => {
    const sn = createSnippet('short text');
    expect(displayTitle(sn)).toBe('short text');
  });

  it('タイトルがなくテキストが40文字超なら先頭40文字＋…を返す', () => {
    const long = 'a'.repeat(41);
    const sn = createSnippet(long);
    expect(displayTitle(sn)).toBe('a'.repeat(40) + '…');
  });
});

describe('loadSnippets / saveSnippets', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('何もない状態では空配列を返す', () => {
    expect(loadSnippets()).toEqual([]);
  });

  it('保存したスニペットを読み込める', () => {
    const sn = createSnippet('test text', 'Test');
    saveSnippets([sn]);
    const loaded = loadSnippets();
    expect(loaded).toHaveLength(1);
    expect(loaded[0].text).toBe('test text');
  });
});
