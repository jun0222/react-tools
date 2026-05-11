export interface WordMemo {
  id: string;
  word: string;
  notes: string;
  createdAt: string;
}

const STORAGE_KEY = 'wordmemo-data';

let _seq = 0;
const newId = () => `wm-${Date.now()}-${++_seq}`;

export const loadMemos = (): WordMemo[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const saveMemos = (items: WordMemo[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch { /* ignore */ }
};

export const createMemo = (word: string, notes = ''): WordMemo => ({
  id: newId(),
  word: word.trim(),
  notes: notes.trim(),
  createdAt: new Date().toISOString(),
});

export const addMemo = (items: WordMemo[], memo: WordMemo): WordMemo[] =>
  [memo, ...items];

export const deleteMemo = (items: WordMemo[], id: string): WordMemo[] =>
  items.filter(m => m.id !== id);

export const filterMemos = (items: WordMemo[], query: string): WordMemo[] => {
  if (!query.trim()) return items;
  const q = query.toLowerCase();
  return items.filter(
    m => m.word.toLowerCase().includes(q) || m.notes.toLowerCase().includes(q),
  );
};

export const generatePrompt = (items: WordMemo[]): string => {
  if (items.length === 0) return '';
  const wordList = items.map(m => {
    const note = m.notes ? `（${m.notes}）` : '';
    return `- ${m.word}${note}`;
  }).join('\n');

  return `以下の単語・概念について、それぞれ詳しく学べる書籍や信頼性の高い文献を調査してください。

【調査対象の単語・概念】
${wordList}

【依頼内容】
各単語・概念に対して、以下の情報を提供してください：
1. 概要・定義（2〜3行）
2. 推薦書籍・文献（書名、著者、出版年、推薦理由）
3. 入門として最適な1冊の具体的な紹介

信頼性の高い学術書・専門書・古典的名著を優先してください。`;
};
