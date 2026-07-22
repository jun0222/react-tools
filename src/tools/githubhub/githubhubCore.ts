export type PrStatus = 'draft' | 'open' | 'review1' | 'fix1' | 'review2' | 'fix2' | 'merged';

export interface PrEntry {
  url: string;
  number: number;
  status: PrStatus;
  title: string;
  dependsOn: number | null;
  repo: string;
  now: boolean;
  assignee: string | null;
}

const STATUS_KEYWORDS: readonly PrStatus[] = ['draft', 'open', 'review1', 'fix1', 'review2', 'fix2', 'merged'];
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

      let now = false;
      const nowMatch = content.match(/[{｛]now[}｝]/);
      if (nowMatch) {
        now = true;
        content = content.replace(nowMatch[0], '').trim();
      }

      let dependsOn: number | null = null;
      const depMatch = content.match(/[{｛]依存:#(\d+)[}｝]/);
      if (depMatch) {
        dependsOn = Number(depMatch[1]);
        content = content.replace(depMatch[0], '').trim();
      }

      let assignee: string | null = null;
      const assigneeMatch = content.match(/[{｛]担当:([^}｛｝]+)[}｝]/);
      if (assigneeMatch) {
        assignee = assigneeMatch[1].trim();
        content = content.replace(assigneeMatch[0], '').trim();
      }

      const tokens = content.split(/\s+/).filter(Boolean);

      let url = '';
      let number = 0;
      let repo = '';
      const urlIdx = tokens.findIndex(t => /\/pull\/\d+/.test(t));
      if (urlIdx !== -1) {
        url = tokens[urlIdx];
        number = Number(url.match(/\/pull\/(\d+)/)![1]);
        repo = url.match(/\/([^/]+)\/pull\/\d+/)?.[1] ?? '';
        tokens.splice(urlIdx, 1);
      }

      let status: PrStatus = 'draft';
      if (tokens.length > 0 && (STATUS_KEYWORDS as readonly string[]).includes(tokens[0])) {
        status = tokens.shift() as PrStatus;
      }

      const title = tokens.join(' ');

      return { url, number, status, title, dependsOn, repo, now, assignee };
    })
    .filter(e => e.url !== '');

const STATUS_LABEL: Record<PrStatus, string> = {
  draft: 'Draft',
  open: 'Open',
  review1: '1次レビューまち',
  fix1: '1次修正中',
  review2: '2次レビューまち',
  fix2: '2次修正中',
  merged: 'Merged',
};

const SUMMARY_ORDER: readonly PrStatus[] = ['merged', 'fix2', 'review2', 'fix1', 'review1', 'open', 'draft'];

export const buildSummary = (entries: PrEntry[], timestamp: string): string => {
  const groups: Record<PrStatus, string[]> = {
    draft: [], open: [], review1: [], fix1: [], review2: [], fix2: [], merged: [],
  };
  for (const e of entries) {
    groups[e.status].push(e.title ? `・#${e.number} ${e.title}` : `・#${e.number}`);
  }

  const sections = SUMMARY_ORDER.map(status => {
    const label = STATUS_LABEL[status];
    return groups[status].length
      ? `【${label}】\n${groups[status].join('\n')}`
      : `【${label}】\nなし`;
  });

  return [`【Github PR】${timestamp}`, ...sections].join('\n\n');
};

// dataviz skill 検証済みカテゴリカルパレット（固定順）
const CATEGORY_PALETTE_LIGHT = [
  '#2a78d6', '#1baf7a', '#eda100', '#008300',
  '#4a3aa7', '#e34948', '#e87ba4', '#eb6834',
];
const CATEGORY_PALETTE_DARK = [
  '#3987e5', '#199e70', '#c98500', '#008300',
  '#9085e9', '#e66767', '#d55181', '#d95926',
];

const assignColors = (keys: string[], dark: boolean): Record<string, string> => {
  const palette = dark ? CATEGORY_PALETTE_DARK : CATEGORY_PALETTE_LIGHT;
  const unique: string[] = [];
  for (const k of keys) if (!unique.includes(k)) unique.push(k);

  const map: Record<string, string> = {};
  unique.forEach((k, i) => { map[k] = palette[i % palette.length]; });
  return map;
};

export const assignRepoColors = (repos: string[], dark: boolean): Record<string, string> =>
  assignColors(repos, dark);

export const assignAssigneeColors = (names: string[], dark: boolean): Record<string, string> =>
  assignColors(names, dark);