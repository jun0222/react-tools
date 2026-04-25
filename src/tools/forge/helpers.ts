// --- ケース変換 ---

/**
 * 任意の表記のテキストをトークン（単語）配列に分解する。
 * camelCase / PascalCase / snake_case / kebab-case / スペース区切り に対応。
 */
const tokenize = (input: string): string[] => {
  const s = input
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2') // ABCDef → ABC Def
    .replace(/([a-z\d])([A-Z])/g, '$1 $2')      // camelCase → camel Case
    .replace(/[-_\s]+/g, ' ')                    // 区切り文字 → スペース
    .trim();
  return s.split(' ').filter(Boolean);
};

export const toPascal = (input: string): string =>
  tokenize(input)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join('');

export const toSnake = (input: string): string =>
  tokenize(input).map(w => w.toLowerCase()).join('_');

export const toCamel = (input: string): string => {
  const tokens = tokenize(input);
  return tokens
    .map((w, i) =>
      i === 0 ? w.toLowerCase() : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
    )
    .join('');
};

export const toKebab = (input: string): string =>
  tokenize(input).map(w => w.toLowerCase()).join('-');

// --- テキスト整形 ---

export const formatJson = (input: string): string | null => {
  if (!input.trim()) return null;
  try {
    return JSON.stringify(JSON.parse(input), null, 2);
  } catch {
    return null;
  }
};

export const formatSql = (input: string): string => {
  if (!input.trim()) return '';
  return input
    .replace(/\s+/g, ' ')
    .trim()
    .replace(
      /\b(select|from|where|left\s+join|right\s+join|inner\s+join|outer\s+join|join|on|group\s+by|order\s+by|having|limit|offset|union\s+all|union|insert\s+into|values|update|set|delete\s+from)\b/gi,
      (match) => '\n' + match.toUpperCase()
    )
    .trim();
};

// --- 文字削除 ---

export const deleteChars = (input: string, targets: string[]): string => {
  const valid = targets.filter(t => t.length > 0);
  if (!valid.length) return input;
  return valid.reduce((text, target) => text.split(target).join(''), input);
};

// --- スペース整形・ワンライナー ---

export const normalizeSpaces = (input: string): string =>
  input
    .split('\n')
    .map(line => line.replace(/[ \t　]+/g, ' ').trim())
    .join('\n')
    .trim();

export const toOneLiner = (input: string): string =>
  input.replace(/\s+/g, ' ').trim();

// --- 箇条書き ---

export const toBulletList = (input: string, bullet: string): string => {
  if (!input) return '';
  const sep = bullet === '・' ? '' : ' ';
  return input
    .split('\n')
    .map(line => {
      const m = line.match(/^([ \t　]*)(.*)/);
      if (!m) return line;
      const [, leading, rest] = m;
      if (!rest.trim()) return line;
      return `${leading}${bullet}${sep}${rest}`;
    })
    .join('\n');
};

// --- MD 末尾スペース ---

export const addMdLineBreaks = (input: string): string =>
  input.split('\n')
    .map(line => (line.trimEnd() ? line.trimEnd() + '  ' : line))
    .join('\n');

// --- MD ラッパー ---

export const wrapHeading = (text: string): string =>
  text.split('\n').map(line => `## ${line}`).join('\n');

export const wrapCodeBlock = (text: string): string =>
  `\`\`\`\n${text}\n\`\`\``;

export const wrapDivider = (text: string): string =>
  `---\n${text}\n---`;

/** MD ドキュメント追記用: ## + コードブロック + --- を一発で適用 */
export const wrapMdDoc = (text: string): string =>
  `## \n\n\`\`\`\n${text}\n\`\`\`\n\n---`;
