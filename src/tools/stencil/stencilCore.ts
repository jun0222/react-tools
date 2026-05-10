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