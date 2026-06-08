import { describe, it, expect } from 'vitest';
import {
  createBookmark, addBookmark, deleteBookmark, updateBookmark,
  filterBookmarks, allTags, exportJson, importJson, parseTags,
  moveToPending, moveToTrash, restoreToActive, emptyTrash, getByStatus,
} from './bookmarksCore';
import type { Bookmark } from './bookmarksCore';

const bm = (overrides: Partial<Bookmark> = {}): Bookmark => ({
  id: 'test-1',
  url: 'https://example.com',
  title: 'Example',
  description: '',
  tags: [],
  createdAt: new Date().toISOString(),
  ...overrides,
});

describe('createBookmark', () => {
  it('URLからブックマークを作成する', () => {
    const b = createBookmark('https://x.com', 'X', '', []);
    expect(b.url).toBe('https://x.com');
    expect(b.title).toBe('X');
  });

  it('タイトルが空のときURLをタイトルにする', () => {
    const b = createBookmark('https://x.com', '', '', []);
    expect(b.title).toBe('https://x.com');
  });

  it('タグのホワイトスペースをトリムする', () => {
    const b = createBookmark('', '', '', [' foo ', ' bar ']);
    expect(b.tags).toEqual(['foo', 'bar']);
  });

  it('空のタグを除外する', () => {
    const b = createBookmark('', '', '', ['', 'foo', '']);
    expect(b.tags).toEqual(['foo']);
  });
});

describe('addBookmark', () => {
  it('先頭に追加する', () => {
    const b1 = bm({ id: '1' });
    const b2 = bm({ id: '2' });
    const result = addBookmark([b1], b2);
    expect(result[0].id).toBe('2');
  });
});

describe('deleteBookmark', () => {
  it('IDに一致するブックマークを削除する', () => {
    const b = bm({ id: 'x' });
    expect(deleteBookmark([b], 'x')).toHaveLength(0);
  });

  it('一致しないIDは削除しない', () => {
    const b = bm({ id: 'x' });
    expect(deleteBookmark([b], 'y')).toHaveLength(1);
  });
});

describe('updateBookmark', () => {
  it('同IDのブックマークを更新する', () => {
    const b = bm({ id: 'x', title: 'old' });
    const updated = { ...b, title: 'new' };
    expect(updateBookmark([b], updated)[0].title).toBe('new');
  });
});

describe('filterBookmarks', () => {
  const items: Bookmark[] = [
    bm({ id: '1', title: 'React Docs', url: 'https://react.dev', tags: ['react', 'docs'] }),
    bm({ id: '2', title: 'Vue Guide', url: 'https://vuejs.org', tags: ['vue'] }),
  ];

  it('クエリなし・タグなしは全件返す', () => {
    expect(filterBookmarks(items, '', '')).toHaveLength(2);
  });

  it('タイトルでフィルタリングする', () => {
    expect(filterBookmarks(items, 'react', '')).toHaveLength(1);
  });

  it('タグでフィルタリングする', () => {
    expect(filterBookmarks(items, '', 'vue')).toHaveLength(1);
  });

  it('URLでフィルタリングする', () => {
    expect(filterBookmarks(items, 'react.dev', '')).toHaveLength(1);
  });

  it('クエリとタグの組み合わせで絞り込む', () => {
    expect(filterBookmarks(items, 'Docs', 'react')).toHaveLength(1);
    expect(filterBookmarks(items, 'Docs', 'vue')).toHaveLength(0);
  });
});

describe('allTags', () => {
  it('全ブックマークのタグを重複なしで返す', () => {
    const items = [
      bm({ tags: ['a', 'b'] }),
      bm({ tags: ['b', 'c'] }),
    ];
    expect(allTags(items)).toEqual(['a', 'b', 'c']);
  });

  it('空リストは空配列を返す', () => {
    expect(allTags([])).toEqual([]);
  });
});

describe('exportJson / importJson', () => {
  it('エクスポートしてインポートすると同じデータになる', () => {
    const items = [bm({ id: '1', tags: ['foo'] })];
    const json = exportJson(items);
    const imported = importJson(json);
    expect(imported[0].id).toBe('1');
    expect(imported[0].tags).toEqual(['foo']);
  });

  it('不正なJSONは空配列を返す', () => {
    expect(importJson('not json')).toEqual([]);
  });

  it('配列でないJSONは空配列を返す', () => {
    expect(importJson('{"a":1}')).toEqual([]);
  });
});

describe('parseTags', () => {
  it('カンマ区切りを分解する', () => {
    expect(parseTags('foo,bar,baz')).toEqual(['foo', 'bar', 'baz']);
  });

  it('スペース区切りも分解する', () => {
    expect(parseTags('foo bar baz')).toEqual(['foo', 'bar', 'baz']);
  });

  it('空文字は空配列を返す', () => {
    expect(parseTags('')).toEqual([]);
  });
});

describe('moveToPending', () => {
  it('対象をpendingにする', () => {
    const b = bm({ id: 'x' });
    const result = moveToPending([b], 'x');
    expect(result[0].status).toBe('pending');
    expect(result[0].pendingAt).toBeDefined();
  });

  it('他のアイテムは変更しない', () => {
    const b1 = bm({ id: '1' });
    const b2 = bm({ id: '2' });
    const result = moveToPending([b1, b2], '1');
    expect(result[1].status).toBeUndefined();
  });
});

describe('moveToTrash', () => {
  it('対象をtrashにする', () => {
    const b = bm({ id: 'x' });
    const result = moveToTrash([b], 'x');
    expect(result[0].status).toBe('trash');
    expect(result[0].trashedAt).toBeDefined();
  });
});

describe('restoreToActive', () => {
  it('statusをactiveに戻す', () => {
    const b = bm({ id: 'x', status: 'trash', trashedAt: Date.now() });
    const result = restoreToActive([b], 'x');
    expect(result[0].status).toBe('active');
  });

  it('pendingAtとtrashedAtをクリアする', () => {
    const b = bm({ id: 'x', status: 'pending', pendingAt: Date.now() });
    const result = restoreToActive([b], 'x');
    expect(result[0].pendingAt).toBeUndefined();
    expect(result[0].trashedAt).toBeUndefined();
  });
});

describe('emptyTrash', () => {
  it('trashアイテムをすべて削除する', () => {
    const items = [
      bm({ id: '1', status: 'active' }),
      bm({ id: '2', status: 'trash' }),
      bm({ id: '3', status: 'pending' }),
    ];
    const result = emptyTrash(items);
    expect(result).toHaveLength(2);
    expect(result.every(b => b.status !== 'trash')).toBe(true);
  });
});

describe('getByStatus', () => {
  it('statusがundefinedのアイテムをactiveとして扱う', () => {
    const b = bm({ id: '1' });
    expect(getByStatus([b], 'active')).toHaveLength(1);
  });

  it('pendingアイテムのみ返す', () => {
    const items = [
      bm({ id: '1' }),
      bm({ id: '2', status: 'pending' }),
    ];
    expect(getByStatus(items, 'pending')).toHaveLength(1);
    expect(getByStatus(items, 'pending')[0].id).toBe('2');
  });

  it('trashアイテムのみ返す', () => {
    const items = [
      bm({ id: '1' }),
      bm({ id: '2', status: 'trash' }),
      bm({ id: '3', status: 'pending' }),
    ];
    expect(getByStatus(items, 'trash')).toHaveLength(1);
  });
});
