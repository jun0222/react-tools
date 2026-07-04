export const DEFAULT_N = 30;

export const buildPrompt = (word: string, n: number): string => {
  const w = word.trim();
  if (!w) return '（トピックを入力してください）';
  return `「${w}」について${n}文字でブログを書いて。`;
};