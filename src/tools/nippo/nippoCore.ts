export type Status = 'completed' | 'in-progress' | 'pending';

export interface NippoEntry {
  label: string;
  startMin: number | null;
  endMin: number | null;
  status: Status;
  now: boolean;
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
      } else if (content.endsWith('未着手')) {
        content = content.slice(0, -3).trim();
      }

      return { label: content, startMin, endMin, status, now };
    });

export const buildSummary = (entries: NippoEntry[], timestamp: string): string => {
  const groups: Record<Status, string[]> = { completed: [], 'in-progress': [], pending: [] };
  for (const e of entries) groups[e.status].push(`・${e.label}`);
  const pending = groups.pending.length
    ? `【未着手】\n${groups.pending.join('\n')}`
    : '【未着手】\nなし';
  const inProgress = groups['in-progress'].length
    ? `【進行中】\n${groups['in-progress'].join('\n')}`
    : '【進行中】\nなし';
  const completed = groups.completed.length
    ? `【完了】\n${groups.completed.join('\n')}`
    : '【完了】\nなし';

  return [`【タスク】${timestamp}`, completed, inProgress, pending].join('\n\n');
};