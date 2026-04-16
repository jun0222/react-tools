// =============================================
// Types
// =============================================
export interface ReplacePair {
  id: string;
  from: string;
  to: string;
  enabled: boolean;
}

export interface RandomRule {
  id: string;
  targetChars: string;
  charSet: string;
  enabled: boolean;
}

// =============================================
// Unique ID
// =============================================
let _counter = 0;
export const uid = (): string => `${Date.now()}-${++_counter}`;

// =============================================
// Character presets
// =============================================
export const CHAR_PRESETS: { key: string; label: string; chars: string }[] = [
  { key: '?',     label: '?マスク',   chars: '?' },
  { key: '*',     label: '*マスク',   chars: '*' },
  { key: '#',     label: '#マスク',   chars: '#' },
  { key: 'upper', label: 'A-Z',       chars: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' },
  { key: 'lower', label: 'a-z',       chars: 'abcdefghijklmnopqrstuvwxyz' },
  { key: 'digit', label: '0-9',       chars: '0123456789' },
];

// =============================================
// KMP: buildKMPFailure
// Computes the failure (partial match) table for the KMP algorithm.
// failure[i] = length of the longest proper prefix of pattern[0..i]
//              that is also a suffix.
// =============================================
export function buildKMPFailure(pattern: string): number[] {
  const n = pattern.length;
  if (n === 0) return [];
  const f = new Array<number>(n).fill(0);
  let k = 0;
  for (let i = 1; i < n; i++) {
    while (k > 0 && pattern[k] !== pattern[i]) k = f[k - 1];
    if (pattern[k] === pattern[i]) k++;
    f[i] = k;
  }
  return f;
}

// =============================================
// KMP: kmpFindAll
// Returns all start indices where pattern occurs in text.
// Overlapping matches are included.
// =============================================
export function kmpFindAll(text: string, pattern: string): number[] {
  if (pattern.length === 0) return [];
  if (pattern.length > text.length) return [];
  const f = buildKMPFailure(pattern);
  const results: number[] = [];
  let q = 0; // number of characters matched
  for (let i = 0; i < text.length; i++) {
    while (q > 0 && pattern[q] !== text[i]) q = f[q - 1];
    if (pattern[q] === text[i]) q++;
    if (q === pattern.length) {
      results.push(i - pattern.length + 1);
      q = f[q - 1]; // allow overlapping
    }
  }
  return results;
}

// =============================================
// KMP: kmpReplace
// Replaces all non-overlapping (leftmost first) occurrences
// of `from` in `text` with `to`.
// =============================================
export function kmpReplace(text: string, from: string, to: string): string {
  if (from.length === 0) return text;
  const positions = kmpFindAll(text, from);
  if (positions.length === 0) return text;

  const parts: string[] = [];
  let cursor = 0;
  for (const pos of positions) {
    if (pos < cursor) continue; // skip overlapping match
    parts.push(text.slice(cursor, pos));
    parts.push(to);
    cursor = pos + from.length;
  }
  parts.push(text.slice(cursor));
  return parts.join('');
}

// =============================================
// LCG: Linear Congruential Generator
// Classic competitive-programming PRNG.
// Parameters (Numerical Recipes):
//   a = 1664525, c = 1013904223, m = 2^32
// =============================================
export class LCG {
  private state: number;

  constructor(seed: number) {
    this.state = seed >>> 0; // treat as unsigned 32-bit
  }

  /** Returns a float in [0, 1) */
  next(): number {
    this.state = ((Math.imul(1664525, this.state) + 1013904223) >>> 0);
    return this.state / 0x100000000;
  }

  /** Pick a random element from a non-empty array */
  pick<T>(arr: T[]): T {
    const idx = Math.floor(this.next() * arr.length);
    return arr[idx];
  }
}

// =============================================
// applyReplacePairs
// Applies multiple before/after replacement pairs in order.
// =============================================
export function applyReplacePairs(text: string, pairs: ReplacePair[]): string {
  let result = text;
  for (const pair of pairs) {
    if (!pair.enabled || pair.from === '') continue;
    result = kmpReplace(result, pair.from, pair.to);
  }
  return result;
}

// =============================================
// applyRandomRules
// For each character in text, if it matches a targetChars set,
// replace it with a randomly picked character from charSet.
// Uses LCG seeded with `seed` for reproducibility.
// =============================================
export function applyRandomRules(text: string, rules: RandomRule[], seed: number): string {
  if (rules.length === 0) return text;
  const lcg = new LCG(seed);
  const chars = [...text];
  for (let i = 0; i < chars.length; i++) {
    for (const rule of rules) {
      if (!rule.enabled || rule.targetChars === '' || rule.charSet === '') continue;
      if (rule.targetChars.includes(chars[i])) {
        const pool = [...rule.charSet];
        chars[i] = lcg.pick(pool);
        break; // first matching rule wins
      }
    }
  }
  return chars.join('');
}

// =============================================
// processPhantom (integration)
// Applies replace pairs first, then random rules.
// =============================================
export function processPhantom(
  text: string,
  pairs: ReplacePair[],
  rules: RandomRule[],
  seed: number,
): string {
  const afterPairs = applyReplacePairs(text, pairs);
  return applyRandomRules(afterPairs, rules, seed);
}

// =============================================
// copyText
// Copies text to clipboard. Returns true on success.
// =============================================
export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
