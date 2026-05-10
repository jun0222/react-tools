export interface TodoItem {
  id: string;
  raw: string;
  done: boolean;
  priority: string | null;
  completionDate: string | null;
  creationDate: string | null;
  text: string;
  projects: string[];
  contexts: string[];
  tags: Record<string, string>;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function parseTodoLine(line: string, id: string): TodoItem {
  let rest = line.trim();
  let done = false;
  let priority: string | null = null;
  let completionDate: string | null = null;
  let creationDate: string | null = null;

  if (rest.startsWith('x ')) {
    done = true;
    rest = rest.slice(2).trim();
    const tokens = rest.split(' ');
    if (DATE_RE.test(tokens[0])) {
      completionDate = tokens[0];
      rest = rest.slice(tokens[0].length).trim();
      const t2 = rest.split(' ');
      if (DATE_RE.test(t2[0])) {
        creationDate = t2[0];
        rest = rest.slice(t2[0].length).trim();
      }
    }
  } else {
    const tokens = rest.split(' ');
    const priMatch = tokens[0]?.match(/^\(([A-Z])\)$/);
    if (priMatch) {
      priority = priMatch[1];
      rest = rest.slice(tokens[0].length).trim();
    }
    const t2 = rest.split(' ');
    if (DATE_RE.test(t2[0])) {
      creationDate = t2[0];
      rest = rest.slice(t2[0].length).trim();
    }
  }

  const words = rest.split(' ');
  const projects = words
    .filter(w => w.startsWith('+') && w.length > 1)
    .map(w => w.slice(1));
  const contexts = words
    .filter(w => w.startsWith('@') && w.length > 1)
    .map(w => w.slice(1));
  const tags: Record<string, string> = {};
  for (const w of words) {
    const m = w.match(/^([a-zA-Z][a-zA-Z0-9-]*):(.+)$/);
    if (m && !w.startsWith('http')) tags[m[1]] = m[2];
  }

  return { id, raw: line, done, priority, completionDate, creationDate, text: rest, projects, contexts, tags };
}

let _seq = 0;
export const newId = () => `todo-${Date.now()}-${++_seq}`;

export function parseTodoTxt(text: string): TodoItem[] {
  return text
    .split('\n')
    .filter(line => line.trim())
    .map(line => parseTodoLine(line, newId()));
}

export function serializeTodoItem(item: TodoItem): string {
  const parts: string[] = [];
  if (item.done) {
    parts.push('x');
    if (item.completionDate) parts.push(item.completionDate);
    if (item.creationDate) parts.push(item.creationDate);
  } else {
    if (item.priority) parts.push(`(${item.priority})`);
    if (item.creationDate) parts.push(item.creationDate);
  }
  parts.push(item.text);
  return parts.join(' ');
}

export function serializeTodoTxt(items: TodoItem[]): string {
  return items.map(serializeTodoItem).join('\n');
}

export function toggleDone(item: TodoItem): TodoItem {
  if (item.done) {
    return { ...item, done: false, completionDate: null };
  }
  return { ...item, done: true, completionDate: new Date().toISOString().slice(0, 10) };
}

export const PRIORITY_ORDER: Record<string, number> = {};
for (let i = 0; i < 26; i++) PRIORITY_ORDER[String.fromCharCode(65 + i)] = i;

export function sortItems(items: TodoItem[]): TodoItem[] {
  return [...items].sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1;
    const pa = a.priority ? (PRIORITY_ORDER[a.priority] ?? 99) : 99;
    const pb = b.priority ? (PRIORITY_ORDER[b.priority] ?? 99) : 99;
    return pa - pb;
  });
}