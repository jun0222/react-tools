export type Status = 'completed' | 'in-progress' | 'deferred' | 'pending';

export interface NippoEntry {
  label: string;
  startMin: number | null;
  endMin: number | null;
  status: Status;
  now: boolean;
  assignee: string | null;
}

const TIME_RE = /(\d{1,2}:\d{2})~(\d{1,2}:\d{2})/;
const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];

const toMin = (s: string): number => {
  const [h, m] = s.split(':').map(Number);
  return h * 60 + m;
};

const pad2 = (n: number): string => String(n).padStart(2, '0');

export const fmtTimestamp = (d: Date): string => {
  const mm = pad2(d.getMonth() + 1);
  const dd = pad2(d.getDate());
  const day = WEEKDAYS[d.getDay()];
  const hh = pad2(d.getHours());
  const min = pad2(d.getMinutes());
  return `${mm}/${dd}(${day}) ${hh}:${min}`;
};

export const parseEntries = (text: string): NippoEntry[] =>
  text
    .split('\n')
    .filter(line => line.trimStart().startsWith('・'))
    .map(line => {
      let content = line.trimStart().slice(1).trim();

      let now = false;
      const nowMatch = content.match(/[{｛]now[}｝]/);
      if (nowMatch) {
        now = true;
        content = content.replace(nowMatch[0], '').trim();
      }

      let assignee: string | null = null;
      const assigneeMatch = content.match(/[{｛]担当:([^}｛｝]+)[}｝]/);
      if (assigneeMatch) {
        assignee = assigneeMatch[1].trim();
        content = content.replace(assigneeMatch[0], '').trim();
      }

      let startMin: number | null = null;
      let endMin: number | null = null;
      const m = content.match(TIME_RE);
      if (m) {
        startMin = toMin(m[1]);
        endMin = toMin(m[2]);
        content = content.replace(m[0], ' ').replace(/\s+/g, ' ').trim();
      }

      let status: Status = 'pending';
      if (content.endsWith('完了')) {
        status = 'completed';
        content = content.slice(0, -2).trim();
      } else if (content.endsWith('進行中')) {
        status = 'in-progress';
        content = content.slice(0, -3).trim();
      } else if (content.endsWith('保留')) {
        status = 'deferred';
        content = content.slice(0, -2).trim();
      } else if (content.endsWith('未着手')) {
        content = content.slice(0, -3).trim();
      }

      return { label: content, startMin, endMin, status, now, assignee };
    });

const STATUS_LABEL: Record<Status, string> = {
  completed: '完了',
  'in-progress': '進行中',
  deferred: '保留',
  pending: '未着手',
};

const SUMMARY_ORDER: readonly Status[] = ['completed', 'in-progress', 'deferred', 'pending'];

export const buildSummary = (entries: NippoEntry[], timestamp: string): string => {
  const groups: Record<Status, string[]> = { completed: [], 'in-progress': [], deferred: [], pending: [] };
  for (const e of entries) groups[e.status].push(`・${e.label}`);

  const sections = SUMMARY_ORDER.map(status => {
    const label = STATUS_LABEL[status];
    return groups[status].length
      ? `【${label}】\n${groups[status].join('\n')}`
      : `【${label}】\nなし`;
  });

  return [`【タスク】${timestamp}`, ...sections].join('\n\n');
};

// dataviz skill 検証済みカテゴリカルパレット（固定順）
const ASSIGNEE_PALETTE_LIGHT = [
  '#2a78d6', '#1baf7a', '#eda100', '#008300',
  '#4a3aa7', '#e34948', '#e87ba4', '#eb6834',
];
const ASSIGNEE_PALETTE_DARK = [
  '#3987e5', '#199e70', '#c98500', '#008300',
  '#9085e9', '#e66767', '#d55181', '#d95926',
];

export const assignAssigneeColors = (names: string[], dark: boolean): Record<string, string> => {
  const palette = dark ? ASSIGNEE_PALETTE_DARK : ASSIGNEE_PALETTE_LIGHT;
  const unique: string[] = [];
  for (const n of names) if (!unique.includes(n)) unique.push(n);

  const map: Record<string, string> = {};
  unique.forEach((n, i) => { map[n] = palette[i % palette.length]; });
  return map;
};