import { describe, it, expect } from 'vitest';
import { parseFlowDSL, renderFlowSVG } from './flowchartCore';

describe('parseFlowDSL', () => {
  it('空文字は空を返す', () => {
    const r = parseFlowDSL('');
    expect(r.nodes.size).toBe(0);
    expect(r.edges).toHaveLength(0);
  });

  it('コメント行を無視する', () => {
    const r = parseFlowDSL('# これはコメント\nA -> B');
    expect(r.nodes.size).toBe(2);
  });

  it('シンプルな接続を解析する', () => {
    const r = parseFlowDSL('A -> B');
    expect(r.nodes.has('A')).toBe(true);
    expect(r.nodes.has('B')).toBe(true);
    expect(r.edges[0]).toEqual({ from: 'A', to: 'B', label: undefined });
  });

  it('ラベル付き接続を解析する', () => {
    const r = parseFlowDSL('A -> B : はい');
    expect(r.edges[0].label).toBe('はい');
  });

  it('インラインカラーを解析する', () => {
    const r = parseFlowDSL('A[blue] -> B[red]');
    expect(r.nodes.get('A')).toBe('blue');
    expect(r.nodes.get('B')).toBe('red');
    expect(r.edges[0]).toMatchObject({ from: 'A', to: 'B' });
  });

  it('スタンドアロンのカラー宣言を解析する', () => {
    const r = parseFlowDSL('A [green]');
    expect(r.nodes.get('A')).toBe('green');
  });

  it('後のカラー宣言で上書きする', () => {
    const r = parseFlowDSL('A -> B\nA [orange]');
    expect(r.nodes.get('A')).toBe('orange');
  });

  it('ノードの出現順序を記録する', () => {
    const r = parseFlowDSL('A -> B\nB -> C');
    expect(r.order).toEqual(['A', 'B', 'C']);
  });

  it('複数エッジを解析する', () => {
    const r = parseFlowDSL('A -> B\nA -> C\nB -> D');
    expect(r.edges).toHaveLength(3);
    expect(r.nodes.size).toBe(4);
  });
});

describe('renderFlowSVG', () => {
  it('ノードなしは空文字を返す', () => {
    const r = parseFlowDSL('');
    expect(renderFlowSVG(r, false)).toBe('');
  });

  it('有効なSVGを返す', () => {
    const r = parseFlowDSL('A -> B');
    const svg = renderFlowSVG(r, false);
    expect(svg).toContain('<svg');
    expect(svg).toContain('</svg>');
  });

  it('ノードのラベルをSVGに含める', () => {
    const r = parseFlowDSL('スタート -> 終了');
    const svg = renderFlowSVG(r, false);
    expect(svg).toContain('スタート');
    expect(svg).toContain('終了');
  });

  it('五角形(polygon)を使用する', () => {
    const r = parseFlowDSL('A -> B');
    const svg = renderFlowSVG(r, false);
    expect(svg).toContain('<polygon');
  });

  it('矢印線を描画しない（五角形が重なって直接接続）', () => {
    const r = parseFlowDSL('A -> B\nB -> C');
    const svg = renderFlowSVG(r, false);
    expect(svg).not.toContain('<line');
    expect(svg).not.toContain('marker-end');
    expect(svg).not.toContain('<defs>');
  });

  it('ノード数分のpolygonを描画する', () => {
    const r = parseFlowDSL('A -> B\nB -> C');
    const svg = renderFlowSVG(r, false);
    const count = (svg.match(/<polygon/g) ?? []).length;
    expect(count).toBe(3);
  });

  it('カラーがSVGに反映される', () => {
    const r = parseFlowDSL('A [blue]');
    const svg = renderFlowSVG(r, false);
    expect(svg).toContain('#3b82f6');
  });

  it('ダークモードで異なる背景色を使用する', () => {
    const r = parseFlowDSL('A -> B');
    const light = renderFlowSVG(r, false);
    const dark  = renderFlowSVG(r, true);
    expect(light).not.toBe(dark);
  });

  it('エッジラベルをSVGに含める', () => {
    const r = parseFlowDSL('A -> B : 承認');
    const svg = renderFlowSVG(r, false);
    expect(svg).toContain('承認');
  });

  it('ラベルなしエッジではpath/line要素を生成しない', () => {
    const r = parseFlowDSL('A -> B');
    const svg = renderFlowSVG(r, false);
    expect(svg).not.toContain('<path');
    expect(svg).not.toContain('<line');
  });
});
