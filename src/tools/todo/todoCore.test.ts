import { describe, it, expect } from 'vitest';
import {
  parseTodoLine,
  parseTodoTxt,
  serializeTodoItem,
  serializeTodoTxt,
  toggleDone,
} from './todoCore';

// ---- parseTodoLine ----
describe('parseTodoLine', () => {
  it('シンプルなテキストをパースする', () => {
    const item = parseTodoLine('Buy groceries', 'id1');
    expect(item.done).toBe(false);
    expect(item.priority).toBeNull();
    expect(item.completionDate).toBeNull();
    expect(item.creationDate).toBeNull();
    expect(item.text).toBe('Buy groceries');
  });

  it('優先度付きタスクをパースする', () => {
    const item = parseTodoLine('(A) Call Mom', 'id1');
    expect(item.priority).toBe('A');
    expect(item.done).toBe(false);
    expect(item.text).toBe('Call Mom');
  });

  it('B〜Z優先度を認識する', () => {
    expect(parseTodoLine('(B) Task', 'id1').priority).toBe('B');
    expect(parseTodoLine('(Z) Task', 'id1').priority).toBe('Z');
  });

  it('作成日付きタスクをパースする', () => {
    const item = parseTodoLine('2011-03-02 Buy groceries', 'id1');
    expect(item.creationDate).toBe('2011-03-02');
    expect(item.text).toBe('Buy groceries');
  });

  it('優先度と作成日が両方ある場合をパースする', () => {
    const item = parseTodoLine('(A) 2011-03-02 Call Mom', 'id1');
    expect(item.priority).toBe('A');
    expect(item.creationDate).toBe('2011-03-02');
    expect(item.text).toBe('Call Mom');
  });

  it('完了タスク（x + 完了日）をパースする', () => {
    const item = parseTodoLine('x 2011-03-02 Call Mom', 'id1');
    expect(item.done).toBe(true);
    expect(item.completionDate).toBe('2011-03-02');
    expect(item.text).toBe('Call Mom');
  });

  it('完了タスク（完了日 + 作成日）をパースする', () => {
    const item = parseTodoLine('x 2011-03-02 2011-03-01 Call Mom', 'id1');
    expect(item.done).toBe(true);
    expect(item.completionDate).toBe('2011-03-02');
    expect(item.creationDate).toBe('2011-03-01');
    expect(item.text).toBe('Call Mom');
  });

  it('完了済みタスクのpriority はnull', () => {
    const item = parseTodoLine('x 2011-03-02 Call Mom', 'id1');
    expect(item.priority).toBeNull();
  });

  it('+project タグを抽出する', () => {
    const item = parseTodoLine('(A) Call Mom +Family', 'id1');
    expect(item.projects).toEqual(['Family']);
  });

  it('複数の +project を抽出する', () => {
    const item = parseTodoLine('Work on website +Website +Work', 'id1');
    expect(item.projects).toEqual(['Website', 'Work']);
  });

  it('@context タグを抽出する', () => {
    const item = parseTodoLine('(A) Call Mom @Phone', 'id1');
    expect(item.contexts).toEqual(['Phone']);
  });

  it('複数の @context を抽出する', () => {
    const item = parseTodoLine('Buy milk @store @errand', 'id1');
    expect(item.contexts).toEqual(['store', 'errand']);
  });

  it('key:value タグを抽出する', () => {
    const item = parseTodoLine('Task due:2026-05-20', 'id1');
    expect(item.tags['due']).toBe('2026-05-20');
  });

  it('+project と @context が混在する場合', () => {
    const item = parseTodoLine('(A) Call Mom @Phone +Family', 'id1');
    expect(item.projects).toEqual(['Family']);
    expect(item.contexts).toEqual(['Phone']);
    expect(item.text).toBe('Call Mom @Phone +Family');
  });

  it('idが設定される', () => {
    const item = parseTodoLine('Task', 'test-id');
    expect(item.id).toBe('test-id');
  });

  it('空文字列はtextが空', () => {
    const item = parseTodoLine('', 'id1');
    expect(item.text).toBe('');
  });
});

// ---- parseTodoTxt ----
describe('parseTodoTxt', () => {
  it('複数行をパースする', () => {
    const items = parseTodoTxt('(A) First\n(B) Second\nThird');
    expect(items).toHaveLength(3);
    expect(items[0].priority).toBe('A');
    expect(items[1].priority).toBe('B');
    expect(items[2].priority).toBeNull();
  });

  it('空行は無視する', () => {
    const items = parseTodoTxt('Task1\n\nTask2\n   \nTask3');
    expect(items).toHaveLength(3);
  });

  it('空文字列は空配列', () => {
    expect(parseTodoTxt('')).toEqual([]);
  });
});

// ---- serializeTodoItem ----
describe('serializeTodoItem', () => {
  it('シンプルなタスクをシリアライズする', () => {
    const item = parseTodoLine('Buy groceries', 'id1');
    expect(serializeTodoItem(item)).toBe('Buy groceries');
  });

  it('優先度付きタスクをシリアライズする', () => {
    const item = parseTodoLine('(A) Call Mom', 'id1');
    expect(serializeTodoItem(item)).toBe('(A) Call Mom');
  });

  it('完了タスクをシリアライズする', () => {
    const item = parseTodoLine('x 2011-03-02 Call Mom', 'id1');
    expect(serializeTodoItem(item)).toBe('x 2011-03-02 Call Mom');
  });

  it('完了日+作成日付きタスクをシリアライズする', () => {
    const item = parseTodoLine('x 2011-03-02 2011-03-01 Call Mom', 'id1');
    expect(serializeTodoItem(item)).toBe('x 2011-03-02 2011-03-01 Call Mom');
  });

  it('作成日付きタスクをシリアライズする', () => {
    const item = parseTodoLine('2011-03-01 Buy milk', 'id1');
    expect(serializeTodoItem(item)).toBe('2011-03-01 Buy milk');
  });
});

// ---- serializeTodoTxt ----
describe('serializeTodoTxt', () => {
  it('複数タスクを改行でつなぐ', () => {
    const items = parseTodoTxt('(A) First\n(B) Second');
    expect(serializeTodoTxt(items)).toBe('(A) First\n(B) Second');
  });
});

// ---- toggleDone ----
describe('toggleDone', () => {
  it('未完了 → 完了に切り替える', () => {
    const item = parseTodoLine('(A) Call Mom', 'id1');
    const toggled = toggleDone(item);
    expect(toggled.done).toBe(true);
    expect(toggled.completionDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('完了 → 未完了に切り替える', () => {
    const item = parseTodoLine('x 2011-03-02 Call Mom', 'id1');
    const toggled = toggleDone(item);
    expect(toggled.done).toBe(false);
    expect(toggled.completionDate).toBeNull();
  });

  it('未完了→完了でもpriority は保持される', () => {
    const item = parseTodoLine('(A) Call Mom', 'id1');
    const toggled = toggleDone(item);
    expect(toggled.priority).toBe('A');
  });
});