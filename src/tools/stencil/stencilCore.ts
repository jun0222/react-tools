const PLACEHOLDER_RE = /%%([^%]+)%%/g;

export const extractPlaceholders = (template: string): string[] => {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const [, key] of template.matchAll(PLACEHOLDER_RE)) {
    if (!seen.has(key)) {
      seen.add(key);
      result.push(key);
    }
  }
  return result;
};

export const applyTemplate = (template: string, values: Record<string, string>): string =>
  template.replace(PLACEHOLDER_RE, (match, key) => values[key] ?? match);

// ---- Saved Templates ----

export interface SavedTemplate {
  id: string;
  name: string;
  template: string;
  savedAt: string;
}

const SAVED_KEY = 'stencil-saved-templates';

export const loadSavedTemplates = (): SavedTemplate[] => {
  try {
    const raw = localStorage.getItem(SAVED_KEY);
    if (raw) return JSON.parse(raw) as SavedTemplate[];
  } catch { /* ignore */ }
  return [];
};

export const saveTemplate = (name: string, template: string): SavedTemplate[] => {
  const all = loadSavedTemplates();
  const next = [...all, {
    id: `st-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name,
    template,
    savedAt: new Date().toISOString(),
  }];
  try { localStorage.setItem(SAVED_KEY, JSON.stringify(next)); } catch { /* ignore */ }
  return next;
};

export const deleteSavedTemplate = (id: string): SavedTemplate[] => {
  const next = loadSavedTemplates().filter(t => t.id !== id);
  try { localStorage.setItem(SAVED_KEY, JSON.stringify(next)); } catch { /* ignore */ }
  return next;
};