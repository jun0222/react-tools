import { describe, it, expect } from 'vitest';
import { toMermaid, toDrawIo, uid } from './helpers';
import type { ErdNode, ErdEdge } from './helpers';

// --- fixtures ---
const makeNode = (id: string, name: string, x = 0, y = 0): ErdNode => ({
  id,
  position: { x, y },
  data: {
    name,
    fields: [
      { id: `${id}-f1`, name: 'id',   type: 'int',    isPK: true,  isFK: false, nullable: false },
      { id: `${id}-f2`, name: 'name', type: 'varchar', isPK: false, isFK: false, nullable: true  },
    ],
  },
});

const makeEdge = (id: string, source: string, target: string, relation = '1:N'): ErdEdge => ({
  id, source, target, data: { relation },
});

// =====================
// toMermaid
// =====================
describe('toMermaid', () => {
  it('エンティティが erDiagram 構文で出力される', () => {
    const result = toMermaid([makeNode('u', 'User')], []);
    expect(result).toContain('erDiagram');
    expect(result).toContain('User');
  });

  it('フィールドの型と名前が含まれる', () => {
    const result = toMermaid([makeNode('u', 'User')], []);
    expect(result).toContain('int id');
    expect(result).toContain('varchar name');
  });

  it('PK が付いたフィールドに PK が付く', () => {
    const result = toMermaid([makeNode('u', 'User')], []);
    expect(result).toContain('PK');
  });

  it('エッジが 1:N のとき Mermaid の関係記号が含まれる', () => {
    const nodes = [makeNode('u', 'User'), makeNode('o', 'Order')];
    const edges = [makeEdge('e1', 'u', 'o', '1:N')];
    const result = toMermaid(nodes, edges);
    expect(result).toContain('User');
    expect(result).toContain('Order');
    expect(result).toMatch(/\|\|--o\{/);
  });

  it('エッジが 1:1 のとき 1:1 記号が含まれる', () => {
    const nodes = [makeNode('a', 'A'), makeNode('b', 'B')];
    const edges = [makeEdge('e1', 'a', 'b', '1:1')];
    const result = toMermaid(nodes, edges);
    expect(result).toMatch(/\|\|--\|\|/);
  });

  it('エッジが N:N のとき N:N 記号が含まれる', () => {
    const nodes = [makeNode('a', 'A'), makeNode('b', 'B')];
    const edges = [makeEdge('e1', 'a', 'b', 'N:N')];
    const result = toMermaid(nodes, edges);
    expect(result).toMatch(/\}o--o\{/);
  });

  it('ノードが空のとき erDiagram だけ返す', () => {
    expect(toMermaid([], [])).toBe('erDiagram');
  });
});

// =====================
// toDrawIo
// =====================
describe('toDrawIo', () => {
  it('mxfile の XML が返される', () => {
    const result = toDrawIo([makeNode('u', 'User')], []);
    expect(result).toContain('<mxfile');
    expect(result).toContain('</mxfile>');
  });

  it('エンティティ名が XML に含まれる', () => {
    const result = toDrawIo([makeNode('u', 'User')], []);
    expect(result).toContain('User');
  });

  it('フィールド名が XML に含まれる', () => {
    const result = toDrawIo([makeNode('u', 'User')], []);
    expect(result).toContain('id');
    expect(result).toContain('name');
  });

  it('エッジが XML に含まれる', () => {
    const nodes = [makeNode('u', 'User'), makeNode('o', 'Order')];
    const edges = [makeEdge('e1', 'u', 'o')];
    const result = toDrawIo(nodes, edges);
    expect(result).toContain('e1');
  });

  it('ノードが空のとき mxfile が返される', () => {
    expect(toDrawIo([], [])).toContain('<mxfile');
  });
});

// =====================
// uid
// =====================
describe('uid', () => {
  it('毎回ユニークな値を返す', () => {
    const ids = Array.from({ length: 50 }, uid);
    expect(new Set(ids).size).toBe(50);
  });
});