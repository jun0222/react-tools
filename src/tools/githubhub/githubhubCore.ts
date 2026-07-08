export type PrStatus = 'draft' | 'open' | 'review' | 'merged';

export interface PrEntry {
  url: string;
  number: number;
  status: PrStatus;
  title: string;
  dependsOn: number | null;
}

const STATUS_KEYWORDS: readonly PrStatus[] = ['draft', 'open', 'review', 'merged'];
const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];

const pad2 = (n: number): string => String(n).padStart(2, '0');

export const fmtTimestamp = (d: Date): string => {
  const mm = pad2(d.getMonth() + 1);
  const dd = pad2(d.getDate());
  const day = WEEKDAYS[d.getDay()];
  const hh = pad2(d.getHours());
  const min = pad2(d.getMinutes());
  return `${mm}/${dd}(${day}) ${hh}:${min}`;
};

export const parseEntries = (text: string): PrEntry[] =>
  text
    .split('\n')
    .filter(line => line.trimStart().startsWith('・'))
    .map(line => {
      let content = line.trimStart().slice(1).trim();

      let dependsOn: number | null = null;
      const depMatch = content.match(/[{｛]依存:#(\d+)[}｝]/);
      if (depMatch) {
        dependsOn = Number(depMatch[1]);
        content = content.replace(depMatch[0], '').trim();
      }

      const tokens = content.split(/\s+/).filter(Boolean);

      let url = '';
      let number = 0;
      const urlIdx = tokens.findIndex(t => /\/pull\/\d+/.test(t));
      if (urlIdx !== -1) {
        url = tokens[urlIdx];
        number = Number(url.match(/\/pull\/(\d+)/)![1]);
        tokens.splice(urlIdx, 1);
      }

      let status: PrStatus = 'draft';
      if (tokens.length > 0 && (STATUS_KEYWORDS as readonly string[]).includes(tokens[0])) {
        status = tokens.shift() as PrStatus;
      }

      const title = tokens.join(' ');

      return { url, number, status, title, dependsOn };
    })
    .filter(e => e.url !== '');

const STATUS_LABEL: Record<PrStatus, string> = {
  draft: 'Draft',
  open: 'Open',
  review: 'Review中',
  merged: 'Merged',
};

const SUMMARY_ORDER: readonly PrStatus[] = ['merged', 'review', 'open', 'draft'];

export const buildSummary = (entries: PrEntry[], timestamp: string): string => {
  const groups: Record<PrStatus, string[]> = { draft: [], open: [], review: [], merged: [] };
  for (const e of entries) {
    groups[e.status].push(e.title ? `・#${e.number} ${e.title}` : `・#${e.number}`);
  }

  const sections = SUMMARY_ORDER.map(status => {
    const label = STATUS_LABEL[status];
    return groups[status].length
      ? `【${label}】\n${groups[status].join('\n')}`
      : `【${label}】\nなし`;
  });

  return [timestamp, ...sections].join('\n\n');
};
