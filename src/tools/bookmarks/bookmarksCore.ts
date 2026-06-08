// ---- Types ----

export type BookmarkStatus = 'active' | 'pending' | 'trash';

export interface Bookmark {
  id: string;
  url: string;
  title: string;
  description: string;
  tags: string[];
  createdAt: string;
  status?: BookmarkStatus;
  pendingAt?: number;
  trashedAt?: number;
}

const STORAGE_KEY = 'bookmarks-data';

let _seq = 0;
const newId = () => `bm-${Date.now()}-${++_seq}`;

// ---- CRUD ----

const PENDING_EXPIRY_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

const processPendingExpiry = (items: Bookmark[]): Bookmark[] => {
  const now = Date.now();
  return items.map(b => {
    if (b.status === 'pending' && b.pendingAt && now - b.pendingAt > PENDING_EXPIRY_MS) {
      return { ...b, status: 'trash' as BookmarkStatus, trashedAt: now };
    }
    return b;
  });
};

export const loadBookmarks = (): Bookmark[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return processPendingExpiry(JSON.parse(raw));
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

export const moveToPending = (items: Bookmark[], id: string): Bookmark[] =>
  items.map(b => b.id === id ? { ...b, status: 'pending' as BookmarkStatus, pendingAt: Date.now() } : b);

export const moveToTrash = (items: Bookmark[], id: string): Bookmark[] =>
  items.map(b => b.id === id ? { ...b, status: 'trash' as BookmarkStatus, trashedAt: Date.now() } : b);

export const restoreToActive = (items: Bookmark[], id: string): Bookmark[] =>
  items.map(b => b.id === id ? { ...b, status: 'active' as BookmarkStatus, pendingAt: undefined, trashedAt: undefined } : b);

export const emptyTrash = (items: Bookmark[]): Bookmark[] =>
  items.filter(b => b.status !== 'trash');

export const getByStatus = (items: Bookmark[], status: BookmarkStatus | 'active'): Bookmark[] =>
  items.filter(b => {
    const s = b.status ?? 'active';
    return s === status;
  });

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
