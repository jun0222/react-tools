export interface Segment {
  text: string;
  skip: boolean;
}

// Longest-first ordering ensures greedy match (3-char before 2-char before 1-char)
export const ROMAJI_TABLE: readonly [string, string][] = [
  // 3-char
  ['sha', 'しゃ'], ['shi', 'し'], ['shu', 'しゅ'], ['she', 'しぇ'], ['sho', 'しょ'],
  ['cha', 'ちゃ'], ['chi', 'ち'], ['chu', 'ちゅ'], ['che', 'ちぇ'], ['cho', 'ちょ'],
  ['tsu', 'つ'],
  ['kya', 'きゃ'], ['kyu', 'きゅ'], ['kyo', 'きょ'],
  ['gya', 'ぎゃ'], ['gyu', 'ぎゅ'], ['gyo', 'ぎょ'],
  ['nya', 'にゃ'], ['nyu', 'にゅ'], ['nyo', 'にょ'],
  ['hya', 'ひゃ'], ['hyu', 'ひゅ'], ['hyo', 'ひょ'],
  ['bya', 'びゃ'], ['byu', 'びゅ'], ['byo', 'びょ'],
  ['pya', 'ぴゃ'], ['pyu', 'ぴゅ'], ['pyo', 'ぴょ'],
  ['mya', 'みゃ'], ['myu', 'みゅ'], ['myo', 'みょ'],
  ['rya', 'りゃ'], ['ryu', 'りゅ'], ['ryo', 'りょ'],
  ['jya', 'じゃ'], ['jyu', 'じゅ'], ['jyo', 'じょ'],
  // 2-char
  ['ka', 'か'], ['ki', 'き'], ['ku', 'く'], ['ke', 'け'], ['ko', 'こ'],
  ['sa', 'さ'], ['si', 'し'], ['su', 'す'], ['se', 'せ'], ['so', 'そ'],
  ['ta', 'た'], ['ti', 'ち'], ['tu', 'つ'], ['te', 'て'], ['to', 'と'],
  ['na', 'な'], ['ni', 'に'], ['nu', 'ぬ'], ['ne', 'ね'], ['no', 'の'],
  ['ha', 'は'], ['hi', 'ひ'], ['hu', 'ふ'], ['he', 'へ'], ['ho', 'ほ'],
  ['ma', 'ま'], ['mi', 'み'], ['mu', 'む'], ['me', 'め'], ['mo', 'も'],
  ['ya', 'や'], ['yu', 'ゆ'], ['yo', 'よ'],
  ['ra', 'ら'], ['ri', 'り'], ['ru', 'る'], ['re', 'れ'], ['ro', 'ろ'],
  ['wa', 'わ'], ['wo', 'を'],
  ['ga', 'が'], ['gi', 'ぎ'], ['gu', 'ぐ'], ['ge', 'げ'], ['go', 'ご'],
  ['za', 'ざ'], ['zi', 'じ'], ['zu', 'ず'], ['ze', 'ぜ'], ['zo', 'ぞ'],
  ['da', 'だ'], ['di', 'ぢ'], ['du', 'づ'], ['de', 'で'], ['do', 'ど'],
  ['ba', 'ば'], ['bi', 'び'], ['bu', 'ぶ'], ['be', 'べ'], ['bo', 'ぼ'],
  ['pa', 'ぱ'], ['pi', 'ぴ'], ['pu', 'ぷ'], ['pe', 'ぺ'], ['po', 'ぽ'],
  ['fa', 'ふぁ'], ['fi', 'ふぃ'], ['fu', 'ふ'], ['fe', 'ふぇ'], ['fo', 'ふぉ'],
  ['ja', 'じゃ'], ['ji', 'じ'], ['ju', 'じゅ'], ['je', 'じぇ'], ['jo', 'じょ'],
  // 1-char vowels
  ['a', 'あ'], ['i', 'い'], ['u', 'う'], ['e', 'え'], ['o', 'お'],
  // long vowel mark
  ['-', 'ー'],
];

const VOWELS = new Set(['a', 'i', 'u', 'e', 'o']);

const isConsonant = (c: string): boolean => /^[a-z]$/.test(c) && !VOWELS.has(c);

const convertSegmentText = (text: string): string => {
  const lower = text.toLowerCase();
  const len = lower.length;
  let result = '';
  let i = 0;

  while (i < len) {
    // Double consonant → っ (n is excluded; nn is handled separately)
    if (
      lower[i] !== 'n' &&
      isConsonant(lower[i]) &&
      i + 1 < len &&
      lower[i] === lower[i + 1]
    ) {
      result += 'っ';
      i++;
      continue;
    }

    // Table lookup: greedy longest-match (array is pre-sorted longest-first)
    let matched = false;
    for (const [roman, kana] of ROMAJI_TABLE) {
      if (lower.startsWith(roman, i)) {
        result += kana;
        i += roman.length;
        matched = true;
        break;
      }
    }
    if (matched) continue;

    // n special case (after table lookup to let na/ni/nya/etc. win first)
    if (lower[i] === 'n') {
      const next = i + 1 < len ? lower[i + 1] : '';
      if (next === "'") {
        result += 'ん';
        i += 2;
        continue;
      }
      // nn: consume both only when the char after is NOT a vowel/y
      if (next === 'n') {
        const afterNext = i + 2 < len ? lower[i + 2] : '';
        if (!VOWELS.has(afterNext) && afterNext !== 'y') {
          result += 'ん';
          i += 2;
        } else {
          result += 'ん';
          i += 1;
        }
        continue;
      }
      // n at end or before consonant (not y)
      if (next === '' || (isConsonant(next) && next !== 'y')) {
        result += 'ん';
        i++;
        continue;
      }
    }

    // Keep as-is (non-romaji, spaces, numbers, etc.)
    result += text[i];
    i++;
  }

  return result;
};

const splitByWords = (text: string, words: string[]): Segment[] => {
  const lower = text.toLowerCase();
  const ranges: [number, number][] = [];
  for (const word of words) {
    const wl = word.toLowerCase();
    let idx = lower.indexOf(wl);
    while (idx !== -1) {
      ranges.push([idx, idx + wl.length]);
      idx = lower.indexOf(wl, idx + 1);
    }
  }
  if (ranges.length === 0) return [{ text, skip: false }];

  ranges.sort((a, b) => a[0] - b[0]);
  const merged: [number, number][] = [];
  for (const [s, e] of ranges) {
    if (merged.length > 0 && s <= merged[merged.length - 1][1]) {
      merged[merged.length - 1][1] = Math.max(merged[merged.length - 1][1], e);
    } else {
      merged.push([s, e]);
    }
  }

  const result: Segment[] = [];
  let last = 0;
  for (const [s, e] of merged) {
    if (s > last) result.push({ text: text.slice(last, s), skip: false });
    result.push({ text: text.slice(s, e), skip: true });
    last = e;
  }
  if (last < text.length) result.push({ text: text.slice(last), skip: false });
  return result;
};

export const parseSegments = (input: string, skipWords: string[]): Segment[] => {
  const segments: Segment[] = [];
  const markerRe = /\{([^}]*)\}/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = markerRe.exec(input)) !== null) {
    if (m.index > last) segments.push({ text: input.slice(last, m.index), skip: false });
    segments.push({ text: m[1], skip: true });
    last = m.index + m[0].length;
  }
  if (last < input.length) segments.push({ text: input.slice(last), skip: false });

  const validWords = skipWords.filter(w => w.trim().length > 0);
  if (validWords.length === 0) return segments;

  const result: Segment[] = [];
  for (const seg of segments) {
    if (seg.skip) { result.push(seg); continue; }
    result.push(...splitByWords(seg.text, validWords));
  }
  return result;
};

export const convertRomaji = (input: string, skipWords: string[] = []): string => {
  if (!input.trim()) return '';
  return parseSegments(input, skipWords)
    .map(s => s.skip ? s.text : convertSegmentText(s.text))
    .join('');
};