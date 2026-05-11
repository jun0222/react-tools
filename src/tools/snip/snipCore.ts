export interface Snippet {
  id: string;
  title: string;
  text: string;
  createdAt: string;
}

const STORAGE_KEY = 'snip-data';

let _seq = 0;
const newId = () => `sn-${Date.now()}-${++_seq}`;

export const loadSnippets = (): Snippet[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const saveSnippets = (items: Snippet[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch { /* ignore */ }
};

export const createSnippet = (text: string, title = ''): Snippet => ({
  id: newId(),
  title: title.trim(),
  text,
  createdAt: new Date().toISOString(),
});

export const addSnippet = (items: Snippet[], sn: Snippet): Snippet[] =>
  [sn, ...items];

export const deleteSnippet = (items: Snippet[], id: string): Snippet[] =>
  items.filter(s => s.id !== id);

export const filterSnippets = (items: Snippet[], query: string): Snippet[] => {
  if (!query.trim()) return items;
  const q = query.toLowerCase();
  return items.filter(
    s => s.title.toLowerCase().includes(q) || s.text.toLowerCase().includes(q),
  );
};

export const displayTitle = (sn: Snippet): string =>
  sn.title || (sn.text.length > 40 ? sn.text.slice(0, 40) + '…' : sn.text);
