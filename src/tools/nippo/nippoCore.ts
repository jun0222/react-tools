export type Status = 'completed' | 'in-progress' | 'pending';

export interface NippoEntry {
  label: string;
  startMin: number | null;
  endMin: number | null;
  status: Status;
}

export const GANTT_START_MIN = 6 * 60;
export const GANTT_END_MIN = 24 * 60;
export const GANTT_RANGE_MIN = GANTT_END_MIN - GANTT_START_MIN;

const TIME_RE = /(\d{1,2}:\d{2})~(\d{1,2}:\d{2})/;

const toMin = (s: string): number => {
  const [h, m] = s.split(':').map(Number);
  return h * 60 + m;
};

export const parseEntries = (text: string): NippoEntry[] =>
  text
    .split('\n')
    .filter(line => line.trimStart().startsWith('・'))
    .map(line => {
      let content = line.trimStart().slice(1).trim();

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
      }

      return { label: content, startMin, endMin, status };
    });

export const barPercent = (
  startMin: number,
  endMin: number,
): { left: number; width: number } => ({
  left: ((startMin - GANTT_START_MIN) / GANTT_RANGE_MIN) * 100,
  width: ((endMin - startMin) / GANTT_RANGE_MIN) * 100,
});

export const buildSummary = (entries: NippoEntry[], timestamp: string): string => {
  const groups: Record<Status, string[]> = { completed: [], 'in-progress': [], pending: [] };
  for (const e of entries) groups[e.status].push(`・${e.label}`);
  const parts: string[] = [timestamp];
  if (groups.completed.length) parts.push(`【完了】\n${groups.completed.join('\n')}`);
  if (groups['in-progress'].length) parts.push(`【進行中】\n${groups['in-progress'].join('\n')}`);
  if (groups.pending.length) parts.push(`【未着手】\n${groups.pending.join('\n')}`);
  return parts.join('\n\n');
};