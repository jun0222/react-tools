// ---- Types ----

export interface ActionItem {
  id: string;
  what: string;
  who: string;
  when: string;
}

export interface AgendaItem {
  id: string;
  title: string;
  discussion: string;
  decisions: string;
  actions: ActionItem[];
}

export interface MeetingData {
  title: string;
  date: string;
  participants: string;
  objective: string;
  agendaItems: AgendaItem[];
}

// ---- ID helpers ----

let _seq = 0;
export const newId = () => `id-${Date.now()}-${++_seq}`;

export const newAction = (): ActionItem => ({
  id: newId(), what: '', who: '', when: '',
});

export const newAgendaItem = (): AgendaItem => ({
  id: newId(), title: '', discussion: '', decisions: '',
  actions: [newAction()],
});

export const emptyMeeting = (): MeetingData => ({
  title: '', date: '', participants: '', objective: '',
  agendaItems: [newAgendaItem()],
});

// ---- Markdown generation ----

export const generateMarkdown = (data: MeetingData): string => {
  const lines: string[] = [];

  lines.push(`# ${data.title || '（会議名未入力）'}`);
  lines.push('');

  if (data.date) lines.push(`**日時:** ${data.date}`);
  if (data.participants) lines.push(`**参加者:** ${data.participants}`);
  if (data.objective) lines.push(`**目的:** ${data.objective}`);
  lines.push('');
  lines.push('---');
  lines.push('');

  const filledItems = data.agendaItems.filter(
    a => a.title || a.discussion || a.decisions || a.actions.some(ac => ac.what),
  );

  filledItems.forEach((item, i) => {
    lines.push(`## ${i + 1}. ${item.title || '（議題未入力）'}`);
    lines.push('');

    if (item.discussion) {
      lines.push('**議論ポイント**');
      item.discussion.split('\n').filter(Boolean).forEach(l => lines.push(`- ${l}`));
      lines.push('');
    }

    if (item.decisions) {
      lines.push('**決定事項**');
      item.decisions.split('\n').filter(Boolean).forEach(l => lines.push(`- ${l}`));
      lines.push('');
    }

    const filledActions = item.actions.filter(a => a.what);
    if (filledActions.length > 0) {
      lines.push('**ネクストアクション**');
      lines.push('');
      lines.push('| アクション | 担当 | 期日 |');
      lines.push('|---|---|---|');
      filledActions.forEach(a => {
        lines.push(`| ${a.what} | ${a.who || '—'} | ${a.when || '—'} |`);
      });
      lines.push('');
    }
  });

  // All actions summary
  const allActions = data.agendaItems
    .flatMap(a => a.actions)
    .filter(a => a.what);

  if (allActions.length > 0) {
    lines.push('---');
    lines.push('');
    lines.push('## ネクストアクション一覧');
    lines.push('');
    lines.push('| アクション | 担当 | 期日 |');
    lines.push('|---|---|---|');
    allActions.forEach(a => {
      lines.push(`| ${a.what} | ${a.who || '—'} | ${a.when || '—'} |`);
    });
    lines.push('');
  }

  return lines.join('\n');
};