import { describe, it, expect } from 'vitest';
import {
  generateMarkdown, emptyMeeting, newAgendaItem, newAction,
} from './minutesCore';
import type { MeetingData } from './minutesCore';

describe('generateMarkdown', () => {
  it('会議名がタイトルに含まれる', () => {
    const data: MeetingData = { ...emptyMeeting(), title: '週次定例', agendaItems: [] };
    expect(generateMarkdown(data)).toContain('# 週次定例');
  });

  it('会議名が空のときプレースホルダーが入る', () => {
    const data: MeetingData = { ...emptyMeeting(), title: '', agendaItems: [] };
    expect(generateMarkdown(data)).toContain('（会議名未入力）');
  });

  it('日時が含まれる', () => {
    const data: MeetingData = { ...emptyMeeting(), date: '2026-05-11', agendaItems: [] };
    expect(generateMarkdown(data)).toContain('2026-05-11');
  });

  it('参加者が含まれる', () => {
    const data: MeetingData = { ...emptyMeeting(), participants: 'Alice, Bob', agendaItems: [] };
    expect(generateMarkdown(data)).toContain('Alice, Bob');
  });

  it('議題タイトルが ## で出力される', () => {
    const item = { ...newAgendaItem(), title: '課題整理', discussion: '', decisions: '', actions: [] };
    const data: MeetingData = { ...emptyMeeting(), agendaItems: [item] };
    expect(generateMarkdown(data)).toContain('## 1. 課題整理');
  });

  it('議論ポイントが箇条書きで出力される', () => {
    const item = { ...newAgendaItem(), title: '', discussion: '課題A\n課題B', decisions: '', actions: [] };
    const data: MeetingData = { ...emptyMeeting(), agendaItems: [item] };
    const md = generateMarkdown(data);
    expect(md).toContain('- 課題A');
    expect(md).toContain('- 課題B');
  });

  it('決定事項が箇条書きで出力される', () => {
    const item = { ...newAgendaItem(), title: '', discussion: '', decisions: '承認', actions: [] };
    const data: MeetingData = { ...emptyMeeting(), agendaItems: [item] };
    expect(generateMarkdown(data)).toContain('- 承認');
  });

  it('ネクストアクションがテーブル形式で出力される', () => {
    const action = { ...newAction(), what: 'ドキュメント作成', who: 'Alice', when: '2026-05-15' };
    const item = { ...newAgendaItem(), title: '', discussion: '', decisions: '', actions: [action] };
    const data: MeetingData = { ...emptyMeeting(), agendaItems: [item] };
    const md = generateMarkdown(data);
    expect(md).toContain('ドキュメント作成');
    expect(md).toContain('Alice');
    expect(md).toContain('2026-05-15');
  });

  it('what が空のアクションはネクストアクション表に含まれない', () => {
    const action = { ...newAction(), what: '', who: 'Alice', when: '' };
    const item = { ...newAgendaItem(), title: '', discussion: '', decisions: '', actions: [action] };
    const data: MeetingData = { ...emptyMeeting(), agendaItems: [item] };
    expect(generateMarkdown(data)).not.toContain('ネクストアクション一覧');
  });

  it('複数アクションがあるとき一覧セクションが出力される', () => {
    const a1 = { ...newAction(), what: 'タスク1', who: 'A', when: '' };
    const a2 = { ...newAction(), what: 'タスク2', who: 'B', when: '' };
    const item = { ...newAgendaItem(), title: '', discussion: '', decisions: '', actions: [a1, a2] };
    const data: MeetingData = { ...emptyMeeting(), agendaItems: [item] };
    const md = generateMarkdown(data);
    expect(md).toContain('ネクストアクション一覧');
    expect(md).toContain('タスク1');
    expect(md).toContain('タスク2');
  });

  it('空の議題アイテムはスキップされる', () => {
    const item = newAgendaItem();
    const data: MeetingData = { ...emptyMeeting(), agendaItems: [item] };
    const md = generateMarkdown(data);
    expect(md).not.toContain('## 1.');
  });
});

describe('emptyMeeting', () => {
  it('空のMeetingDataを返す', () => {
    const data = emptyMeeting();
    expect(data.title).toBe('');
    expect(data.agendaItems).toHaveLength(1);
  });
});