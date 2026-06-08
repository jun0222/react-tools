import { describe, it, expect } from 'vitest';
import { buildCode } from './ganttCore';
import type { GanttData } from './ganttCore';

const minimal: GanttData = {
  title: 'テスト',
  dateFormat: 'YYYY-MM-DD',
  sections: [],
};

describe('buildCode', () => {
  it('ヘッダー行を生成する', () => {
    const code = buildCode(minimal);
    expect(code).toContain('gantt');
    expect(code).toContain('title テスト');
    expect(code).toContain('dateFormat YYYY-MM-DD');
  });

  it('セクションを出力する', () => {
    const data: GanttData = {
      ...minimal,
      sections: [{ id: 's1', name: '設計', tasks: [] }],
    };
    expect(buildCode(data)).toContain('section 設計');
  });

  it('タスクを出力する', () => {
    const data: GanttData = {
      ...minimal,
      sections: [{
        id: 's1', name: '開発', tasks: [
          { id: 't1', name: '実装', start: '2024-01-01', duration: '3d' },
        ],
      }],
    };
    const code = buildCode(data);
    expect(code).toContain('実装 :2024-01-01, 3d');
  });

  it('critタスクにcritプレフィックスを付ける', () => {
    const data: GanttData = {
      ...minimal,
      sections: [{
        id: 's1', name: 'フェーズ', tasks: [
          { id: 't1', name: '重要', start: '2024-01-01', duration: '5d', crit: true },
        ],
      }],
    };
    expect(buildCode(data)).toContain('重要 :crit, 2024-01-01, 5d');
  });

  it('critなしはcritプレフィックスなし', () => {
    const data: GanttData = {
      ...minimal,
      sections: [{
        id: 's1', name: 'f', tasks: [
          { id: 't1', name: '通常', start: '2024-01-01', duration: '1d', crit: false },
        ],
      }],
    };
    const code = buildCode(data);
    expect(code).not.toContain('crit');
    expect(code).toContain('通常 :2024-01-01, 1d');
  });

  it('複数セクション・複数タスクを正しく出力する', () => {
    const data: GanttData = {
      title: 'P',
      dateFormat: 'YYYY-MM-DD',
      sections: [
        { id: 's1', name: 'A', tasks: [{ id: 't1', name: 'a1', start: '2024-01-01', duration: '2d' }] },
        { id: 's2', name: 'B', tasks: [{ id: 't2', name: 'b1', start: '2024-01-03', duration: '3d' }] },
      ],
    };
    const code = buildCode(data);
    expect(code).toContain('section A');
    expect(code).toContain('section B');
    expect(code).toContain('a1 :2024-01-01, 2d');
    expect(code).toContain('b1 :2024-01-03, 3d');
  });
});
