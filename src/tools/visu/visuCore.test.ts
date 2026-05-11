import { describe, it, expect } from 'vitest';
import {
  parseCsv, extractBarData, generateBarSVG,
  emptyMatrix, getCell, setCell, parseNumber,
} from './visuCore';

describe('parseCsv', () => {
  it('空文字は空データを返す', () => {
    const d = parseCsv('');
    expect(d.headers).toHaveLength(0);
    expect(d.rows).toHaveLength(0);
  });

  it('1行目をヘッダーとして解析する', () => {
    const d = parseCsv('名前,値\nA,10');
    expect(d.headers).toEqual(['名前', '値']);
  });

  it('2行目以降をデータ行として解析する', () => {
    const d = parseCsv('名前,値\nA,10\nB,20');
    expect(d.rows).toHaveLength(2);
    expect(d.rows[0]).toEqual(['A', '10']);
  });

  it('セルの空白をトリムする', () => {
    const d = parseCsv('a , b\n 1 , 2 ');
    expect(d.headers).toEqual(['a', 'b']);
    expect(d.rows[0]).toEqual(['1', '2']);
  });
});

describe('parseNumber', () => {
  it('整数を解析する', () => { expect(parseNumber('42')).toBe(42); });
  it('小数を解析する', () => { expect(parseNumber('3.14')).toBe(3.14); });
  it('カンマ区切りを除去して解析する', () => { expect(parseNumber('1,000')).toBe(1000); });
  it('非数値はnullを返す', () => { expect(parseNumber('abc')).toBeNull(); });
  it('空文字はnullを返す', () => { expect(parseNumber('')).toBeNull(); });
});

describe('extractBarData', () => {
  it('ラベルと値のペアを返す', () => {
    const csv = parseCsv('名前,値\nA,10\nB,20');
    const data = extractBarData(csv);
    expect(data).toEqual([{ label: 'A', value: 10 }, { label: 'B', value: 20 }]);
  });

  it('数値でない行は除外する', () => {
    const csv = parseCsv('名前,値\nA,10\nB,abc');
    expect(extractBarData(csv)).toHaveLength(1);
  });

  it('行が空のとき空配列を返す', () => {
    const csv = parseCsv('名前,値');
    expect(extractBarData(csv)).toHaveLength(0);
  });
});

describe('generateBarSVG', () => {
  it('データがあるときSVGを返す', () => {
    const svg = generateBarSVG([{ label: 'A', value: 10 }], false);
    expect(svg).toContain('<svg');
  });

  it('データが空のとき空文字を返す', () => {
    expect(generateBarSVG([], false)).toBe('');
  });

  it('ラベルがSVGに含まれる', () => {
    const svg = generateBarSVG([{ label: 'テスト', value: 5 }], false);
    expect(svg).toContain('テスト');
  });
});

describe('matrix', () => {
  it('emptyMatrixは空の構造を返す', () => {
    const m = emptyMatrix();
    expect(m.rowLabels).toHaveLength(3);
    expect(m.colLabels).toHaveLength(3);
  });

  it('getCell: 未設定のセルは空文字', () => {
    const m = emptyMatrix();
    expect(getCell(m, 'r', 'c')).toBe('');
  });

  it('setCell: 値を設定してgetCellで取得できる', () => {
    const m = setCell(emptyMatrix(), 'r1', 'c1', 'hello');
    expect(getCell(m, 'r1', 'c1')).toBe('hello');
  });

  it('setCell: イミュータブル（元のオブジェクトを変えない）', () => {
    const m = emptyMatrix();
    setCell(m, 'r', 'c', 'x');
    expect(getCell(m, 'r', 'c')).toBe('');
  });
});
