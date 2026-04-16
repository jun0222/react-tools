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
  targetStr: string; // KMP で検索する対象文字列
  enabled: boolean;
}

// =============================================
// Unique ID
// =============================================
let _counter = 0;
export const uid = (): string => `${Date.now()}-${++_counter}`;

// =============================================
// Character class pools (computed once at module load)
// =============================================
export const POOL_LOWER = [...'abcdefghijklmnopqrstuvwxyz'];
export const POOL_UPPER = [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'];
export const POOL_DIGIT = [...'0123456789'];
// Hiragana U+3041–U+3096
export const POOL_HIRA  = Array.from({ length: 0x3096 - 0x3041 + 1 }, (_, i) =>
  String.fromCodePoint(0x3041 + i));
// Katakana U+30A1–U+30F6
export const POOL_KATA  = Array.from({ length: 0x30F6 - 0x30A1 + 1 }, (_, i) =>
  String.fromCodePoint(0x30A1 + i));
// CJK Unified Ideographs U+4E00–U+9FFF
export const POOL_KANJI = Array.from({ length: 0x9FFF - 0x4E00 + 1 }, (_, i) =>
  String.fromCodePoint(0x4E00 + i));

/**
 * Returns the character pool for the same class as `ch`,
 * or null if the character has no known class.
 */
export function getCharPool(ch: string): string[] | null {
  const code = ch.codePointAt(0) ?? 0;
  if (ch >= 'a' && ch <= 'z') return POOL_LOWER;
  if (ch >= 'A' && ch <= 'Z') return POOL_UPPER;
  if (ch >= '0' && ch <= '9') return POOL_DIGIT;
  if (code >= 0x3041 && code <= 0x3096) return POOL_HIRA;
  if (code >= 0x30A1 && code <= 0x30F6) return POOL_KATA;
  if (code >= 0x4E00 && code <= 0x9FFF) return POOL_KANJI;
  return null;
}

// =============================================
// KMP: buildKMPFailure
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
// Returns all start indices (non-overlapping, leftmost first).
// =============================================
export function kmpFindAll(text: string, pattern: string): number[] {
  if (pattern.length === 0) return [];
  if (pattern.length > text.length) return [];
  const f = buildKMPFailure(pattern);
  const results: number[] = [];
  let q = 0;
  for (let i = 0; i < text.length; i++) {
    while (q > 0 && pattern[q] !== text[i]) q = f[q - 1];
    if (pattern[q] === text[i]) q++;
    if (q === pattern.length) {
      results.push(i - pattern.length + 1);
      q = f[q - 1]; // allow overlapping (caller decides)
    }
  }
  return results;
}

// =============================================
// KMP: kmpReplace
// Non-overlapping leftmost-first replacement.
// =============================================
export function kmpReplace(text: string, from: string, to: string): string {
  if (from.length === 0) return text;
  const positions = kmpFindAll(text, from);
  if (positions.length === 0) return text;

  const parts: string[] = [];
  let cursor = 0;
  for (const pos of positions) {
    if (pos < cursor) continue;
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
// Parameters (Numerical Recipes): a=1664525, c=1013904223, m=2^32
// =============================================
export class LCG {
  private state: number;

  constructor(seed: number) {
    this.state = seed >>> 0;
  }

  next(): number {
    this.state = ((Math.imul(1664525, this.state) + 1013904223) >>> 0);
    return this.state / 0x100000000;
  }

  pick<T>(arr: T[]): T {
    return arr[Math.floor(this.next() * arr.length)];
  }
}

// =============================================
// applyReplacePairs
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
// Each rule specifies a TARGET STRING (found via KMP, non-overlapping
// leftmost-first). Within each matched region, every character is
// replaced by a random character from the SAME class (a-z, A-Z, 0-9,
// hiragana, katakana, kanji), excluding the original character.
// Characters with no known class (punctuation, spaces, etc.) are
// left unchanged.
// =============================================
export function applyRandomRules(text: string, rules: RandomRule[], seed: number): string {
  if (rules.length === 0) return text;

  // Unicode-aware character array
  const textArr = [...text];
  const n = textArr.length;

  // Boolean mask: which positions should be randomized
  const mask = new Uint8Array(n);

  for (const rule of rules) {
    if (!rule.enabled || rule.targetStr === '') continue;
    const pat = [...rule.targetStr];
    const m = pat.length;
    // Non-overlapping leftmost-first search on char array
    let i = 0;
    while (i <= n - m) {
      let j = 0;
      while (j < m && textArr[i + j] === pat[j]) j++;
      if (j === m) {
        for (let k = 0; k < m; k++) mask[i + k] = 1;
        i += m; // skip past match (non-overlapping)
      } else {
        i++;
      }
    }
  }

  const lcg = new LCG(seed);
  for (let i = 0; i < n; i++) {
    if (!mask[i]) continue;
    const pool = getCharPool(textArr[i]);
    if (pool === null) continue; // leave unknown chars unchanged
    const filtered = pool.filter(c => c !== textArr[i]);
    if (filtered.length === 0) continue;
    textArr[i] = lcg.pick(filtered);
  }

  return textArr.join('');
}

// =============================================
// processPhantom (integration)
// Apply replace pairs first, then random rules.
// =============================================
export function processPhantom(
  text: string,
  pairs: ReplacePair[],
  rules: RandomRule[],
  seed: number,
): string {
  return applyRandomRules(applyReplacePairs(text, pairs), rules, seed);
}

// =============================================
// copyText
// =============================================
export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}