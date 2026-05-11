import { describe, it, expect } from 'vitest';
import { parseTree, countLeaves, layoutTree, generateSVG } from './logtreeCore';

describe('parseTree', () => {
  it('単一行はルートのみを返す', () => {
    const t = parseTree('root');
    expect(t?.label).toBe('root');
    expect(t?.children).toHaveLength(0);
  });

  it('null を返すとき空文字を渡した場合', () => {
    expect(parseTree('')).toBeNull();
    expect(parseTree('   ')).toBeNull();
  });

  it('2スペースインデントでネストされる', () => {
    const t = parseTree('root\n  child');
    expect(t?.children).toHaveLength(1);
    expect(t?.children[0].label).toBe('child');
  });

  it('タブインデントも認識する', () => {
    const t = parseTree('root\n\tchild');
    expect(t?.children).toHaveLength(1);
    expect(t?.children[0].label).toBe('child');
  });

  it('複数の子ノードを持てる', () => {
    const t = parseTree('root\n  A\n  B\n  C');
    expect(t?.children).toHaveLength(3);
  });

  it('階層が深くなれる', () => {
    const t = parseTree('root\n  parent\n    child');
    expect(t?.children[0].children[0].label).toBe('child');
  });

  it('空行はスキップされる', () => {
    const t = parseTree('root\n\n  child');
    expect(t?.children).toHaveLength(1);
  });
});

describe('countLeaves', () => {
  it('子のないノードは1', () => {
    expect(countLeaves({ label: 'a', children: [] })).toBe(1);
  });

  it('子が2つで葉なしなら2', () => {
    const node = {
      label: 'root',
      children: [
        { label: 'a', children: [] },
        { label: 'b', children: [] },
      ],
    };
    expect(countLeaves(node)).toBe(2);
  });
});

describe('layoutTree', () => {
  it('right: ルートのx=20', () => {
    const t = parseTree('root')!;
    const p = layoutTree(t, 'right');
    expect(p.x).toBe(20);
  });

  it('right: 子のxはルートより大きい', () => {
    const t = parseTree('root\n  child')!;
    const p = layoutTree(t, 'right');
    expect(p.children[0].x).toBeGreaterThan(p.x);
  });

  it('down: ルートのy=20', () => {
    const t = parseTree('root')!;
    const p = layoutTree(t, 'down');
    expect(p.y).toBe(20);
  });

  it('down: 子のyはルートより大きい', () => {
    const t = parseTree('root\n  child')!;
    const p = layoutTree(t, 'down');
    expect(p.children[0].y).toBeGreaterThan(p.y);
  });
});

describe('generateSVG', () => {
  it('SVGタグを含む', () => {
    const t = parseTree('root')!;
    const p = layoutTree(t, 'right');
    const svg = generateSVG(p, false, 'right');
    expect(svg).toContain('<svg');
    expect(svg).toContain('</svg>');
  });

  it('ノードのラベルが含まれる', () => {
    const t = parseTree('mynode')!;
    const p = layoutTree(t, 'right');
    const svg = generateSVG(p, false, 'right');
    expect(svg).toContain('mynode');
  });

  it('XMLエスケープが適用される', () => {
    const t = parseTree('a&b')!;
    const p = layoutTree(t, 'right');
    const svg = generateSVG(p, false, 'right');
    expect(svg).toContain('a&amp;b');
  });
});