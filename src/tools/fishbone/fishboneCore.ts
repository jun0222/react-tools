export interface Cause {
  id: string;
  text: string;
}

export interface Category {
  id: string;
  name: string;
  causes: Cause[];
}

export interface FishboneData {
  effect: string;
  categories: Category[];
}

export const buildCode = (data: FishboneData): string => {
  const esc = (s: string) => s.replace(/"/g, "'");
  const lines = [
    'ishikawa',
    `    "${esc(data.effect)}"`,
  ];
  for (const cat of data.categories) {
    lines.push(`        "${esc(cat.name)}"`);
    for (const cause of cat.causes) {
      lines.push(`            "${esc(cause.text)}"`);
    }
  }
  return lines.join('\n');
};
