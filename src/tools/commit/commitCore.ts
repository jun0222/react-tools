export const formatCommit = (type: string, scope: string, desc: string): string => {
  if (!type.trim() || !desc.trim()) return '';
  const s = scope.trim();
  return s ? `${type.trim()}(${s}): ${desc.trim()}` : `${type.trim()}: ${desc.trim()}`;
};

export const addToHistory = (history: string[], value: string, max = 20): string[] => {
  const v = value.trim();
  if (!v) return history;
  const deduped = history.filter(h => h !== v);
  return [v, ...deduped].slice(0, max);
};

export interface CommitHistory {
  types: string[];
  scopes: string[];
  descs: string[];
}

export const exportHistoryJson = (
  types: string[],
  scopes: string[],
  descs: string[],
): string => JSON.stringify({ types, scopes, descs }, null, 2);

export const importHistoryJson = (json: string): CommitHistory | null => {
  try {
    const obj = JSON.parse(json);
    if (typeof obj !== 'object' || obj === null) return null;
    return {
      types:  Array.isArray(obj.types)  ? obj.types  : [],
      scopes: Array.isArray(obj.scopes) ? obj.scopes : [],
      descs:  Array.isArray(obj.descs)  ? obj.descs  : [],
    };
  } catch {
    return null;
  }
};
