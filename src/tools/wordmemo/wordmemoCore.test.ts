import { describe, it, expect, beforeEach } from 'vitest';
import {
  createMemo, addMemo, deleteMemo, filterMemos,
  generatePrompt, loadMemos, saveMemos,
} from './wordmemoCore';
import type { WordMemo } from './wordmemoCore';

describe('createMemo', () => {
  it('単語とメモでWordMemoを生成できる', () => {
    const m = createMemo('認知的不協和', '行動変容との関係');
    expect(m.word).toBe('認知的不協和');
    expect(m.notes).toBe('行動変容との関係');
    expect(m.id).toMatch(/^wm-/);
    expect(m.createdAt).toBeTruthy();
  });

  it('前後の空白はトリムされる', () => {
    const m = createMemo('  word  ', '  note  ');
    expect(m.word).toBe('word');
    expect(m.notes).toBe('note');
  });

  it('メモ省略時は空文字になる', () => {
    const m = createMemo('word');
    expect(m.notes).toBe('');
  });
});

describe('addMemo', () => {
  it('リストの先頭に追加される', () => {
    const m1 = createMemo('first');
    const m2 = createMemo('second');
    const list = addMemo([m1], m2);
    expect(list[0]).toBe(m2);
    expect(list[1]).toBe(m1);
  });
});

describe('deleteMemo', () => {
  it('指定した id のメモを削除できる', () => {
    const m1 = createMemo('a');
    const m2 = createMemo('b');
    const list = deleteMemo([m1, m2], m1.id);
    expect(list).toHaveLength(1);
    expect(list[0]).toBe(m2);
  });

  it('存在しない id は無視される', () => {
    const m = createMemo('a');
    expect(deleteMemo([m], 'no-such-id')).toHaveLength(1);
  });
});

describe('filterMemos', () => {
  let items: WordMemo[];
  beforeEach(() => {
    items = [
      createMemo('認知的不協和', '行動変容'),
      createMemo('システム思考', ''),
      createMemo('ファーストプリンシプル', 'イーロン・マスクの思考法'),
    ];
  });

  it('空クエリは全件返す', () => {
    expect(filterMemos(items, '')).toHaveLength(3);
  });

  it('スペースのみのクエリは全件返す', () => {
    expect(filterMemos(items, '   ')).toHaveLength(3);
  });

  it('単語で検索できる', () => {
    expect(filterMemos(items, 'システム')).toHaveLength(1);
  });

  it('メモで検索できる', () => {
    expect(filterMemos(items, '行動変容')).toHaveLength(1);
  });

  it('大文字小文字を無視する', () => {
    const ascii = [createMemo('SystemThinking', 'loops'), createMemo('認知的不協和', '')];
    expect(filterMemos(ascii, 'SYSTEM')).toHaveLength(1);
  });

  it('マッチしないクエリは空配列を返す', () => {
    expect(filterMemos(items, 'zzzzzzz')).toHaveLength(0);
  });
});

describe('generatePrompt', () => {
  it('空のリストは空文字を返す', () => {
    expect(generatePrompt([])).toBe('');
  });

  it('単語リストが含まれる', () => {
    const items = [createMemo('システム思考'), createMemo('認知的不協和', 'フェスティンガー')];
    const prompt = generatePrompt(items);
    expect(prompt).toContain('システム思考');
    expect(prompt).toContain('認知的不協和');
    expect(prompt).toContain('フェスティンガー');
  });

  it('メモがある単語は括弧で追記される', () => {
    const items = [createMemo('キーワード', '補足メモ')];
    const prompt = generatePrompt(items);
    expect(prompt).toContain('- キーワード（補足メモ）');
  });

  it('メモがない単語は括弧なしで出力される', () => {
    const items = [createMemo('キーワード')];
    const prompt = generatePrompt(items);
    expect(prompt).toContain('- キーワード');
    expect(prompt).not.toContain('（）');
  });

  it('書籍・文献を調査する指示が含まれる', () => {
    const items = [createMemo('システム思考')];
    const prompt = generatePrompt(items);
    expect(prompt).toContain('書籍');
    expect(prompt).toContain('文献');
  });
});

describe('loadMemos / saveMemos', () => {
  beforeEach(() => { localStorage.clear(); });

  it('何もない状態では空配列を返す', () => {
    expect(loadMemos()).toEqual([]);
  });

  it('保存したメモを読み込める', () => {
    const m = createMemo('テスト単語', 'テストメモ');
    saveMemos([m]);
    const loaded = loadMemos();
    expect(loaded).toHaveLength(1);
    expect(loaded[0].word).toBe('テスト単語');
  });
});
