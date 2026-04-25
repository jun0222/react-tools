export type SplitMode = 'paragraph' | 'line' | 'chars';

export const splitText = (text: string, mode: SplitMode, charsPerPage = 300): string[] => {
  if (!text.trim()) return [];
  if (mode === 'paragraph') {
    return text.split(/\n{2,}/).map(p => p.trim()).filter(Boolean);
  }
  if (mode === 'line') {
    return text.split('\n').map(l => l.trim()).filter(Boolean);
  }
  // chars mode
  const chunks: string[] = [];
  for (let pos = 0; pos < text.length; pos += charsPerPage) {
    const chunk = text.slice(pos, pos + charsPerPage).trim();
    if (chunk) chunks.push(chunk);
  }
  return chunks;
};