// ---- Types ----

export interface Bookmark {
  id: string;
  url: string;
  title: string;
  description: string;
  tags: string[];
  createdAt: string;
}

const STORAGE_KEY = 'bookmarks-data';

let _seq = 0;
const newId = () => `bm-${Date.now()}-${++_seq}`;

// ---- CRUD ----

export const loadBookmarks = (): Bookmark[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const saveBookmarks = (items: Bookmark[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch { /* ignore */ }
};

export const createBookmark = (
  url: string,
  title: string,
  description: string,
  tags: string[],
): Bookmark => ({
  id: newId(),
  url,
  title: title || url,
  description,
  tags: tags.map(t => t.trim()).filter(Boolean),
  createdAt: new Date().toISOString(),
});

export const addBookmark = (items: Bookmark[], bm: Bookmark): Bookmark[] =>
  [bm, ...items];

export const deleteBookmark = (items: Bookmark[], id: string): Bookmark[] =>
  items.filter(b => b.id !== id);

export const updateBookmark = (items: Bookmark[], updated: Bookmark): Bookmark[] =>
  items.map(b => b.id === updated.id ? updated : b);

// ---- Filter ----

export const filterBookmarks = (
  items: Bookmark[],
  query: string,
  tag: string,
): Bookmark[] => {
  const q = query.toLowerCase();
  return items.filter(b => {
    const matchTag = !tag || b.tags.includes(tag);
    const matchQuery = !q
      || b.title.toLowerCase().includes(q)
      || b.url.toLowerCase().includes(q)
      || b.description.toLowerCase().includes(q)
      || b.tags.some(t => t.toLowerCase().includes(q));
    return matchTag && matchQuery;
  });
};

export const allTags = (items: Bookmark[]): string[] => {
  const set = new Set<string>();
  items.forEach(b => b.tags.forEach(t => set.add(t)));
  return [...set].sort();
};

// ---- Import/Export ----

export const exportJson = (items: Bookmark[]): string =>
  JSON.stringify(items, null, 2);

export const importJson = (json: string): Bookmark[] => {
  try {
    const data = JSON.parse(json);
    if (!Array.isArray(data)) return [];
    return data.filter(
      (b): b is Bookmark =>
        typeof b.id === 'string' &&
        typeof b.url === 'string' &&
        typeof b.title === 'string' &&
        Array.isArray(b.tags),
    );
  } catch {
    return [];
  }
};

// ---- Tag parsing ----

export const parseTags = (tagStr: string): string[] =>
  tagStr.split(/[,\s]+/).map(t => t.trim()).filter(Boolean);
