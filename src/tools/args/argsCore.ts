export const tokenize = (cmd: string): string[] => {
  const trimmed = cmd.trim();
  if (!trimmed) return [];
  return trimmed.split(/\s+/);
};

export interface Mapping {
  index: number;
  replacement: string;
}

export const applyMappings = (tokens: string[], mappings: Mapping[]): string[] => {
  const result = [...tokens];
  for (const { index, replacement } of mappings) {
    if (replacement.trim() && index >= 0 && index < result.length) {
      result[index] = replacement;
    }
  }
  return result;
};

export const diffIndices = (original: string[], modified: string[]): Set<number> => {
  const changed = new Set<number>();
  original.forEach((t, i) => { if (t !== modified[i]) changed.add(i); });
  return changed;
};

export const buildResult = (tokens: string[]): string => tokens.join(' ');
