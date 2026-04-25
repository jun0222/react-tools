import { describe, it, expect } from 'vitest';
import {
  toPascal, toSnake, toCamel, toKebab,
  wrapHeading, wrapCodeBlock, wrapDivider, wrapMdDoc,
  formatJson, formatSql, toOneLiner,
  normalizeSpaces, toBulletList,
} from './helpers';

// =====================
// ケース変換
// =====================
describe('toPascal', () => {
  it('スペース区切りをパスカルケースに変換する', () => {
    expect(toPascal('hello world')).toBe('HelloWorld');
  });
  it('スネークケースをパスカルケースに変換する', () => {
    expect(toPascal('hello_world')).toBe('HelloWorld');
  });
  it('ケバブケースをパスカルケースに変換する', () => {
    expect(toPascal('hello-world')).toBe('HelloWorld');
  });
  it('キャメルケースをパスカルケースに変換する', () => {
    expect(toPascal('helloWorld')).toBe('HelloWorld');
  });
  it('単語が1つでも正しく変換する', () => {
    expect(toPascal('hello')).toBe('Hello');
  });
  it('空文字は空文字を返す', () => {
    expect(toPascal('')).toBe('');
  });
});

describe('toSnake', () => {
  it('スペース区切りをスネークケースに変換する', () => {
    expect(toSnake('hello world')).toBe('hello_world');
  });
  it('パスカルケースをスネークケースに変換する', () => {
    expect(toSnake('HelloWorld')).toBe('hello_world');
  });
  it('キャメルケースをスネークケースに変換する', () => {
    expect(toSnake('helloWorld')).toBe('hello_world');
  });
  it('ケバブケースをスネークケースに変換する', () => {
    expect(toSnake('hello-world')).toBe('hello_world');
  });
  it('空文字は空文字を返す', () => {
    expect(toSnake('')).toBe('');
  });
});

describe('toCamel', () => {
  it('スペース区切りをキャメルケースに変換する', () => {
    expect(toCamel('hello world')).toBe('helloWorld');
  });
  it('パスカルケースをキャメルケースに変換する', () => {
    expect(toCamel('HelloWorld')).toBe('helloWorld');
  });
  it('スネークケースをキャメルケースに変換する', () => {
    expect(toCamel('hello_world')).toBe('helloWorld');
  });
  it('ケバブケースをキャメルケースに変換する', () => {
    expect(toCamel('hello-world')).toBe('helloWorld');
  });
  it('空文字は空文字を返す', () => {
    expect(toCamel('')).toBe('');
  });
});

describe('toKebab', () => {
  it('スペース区切りをケバブケースに変換する', () => {
    expect(toKebab('hello world')).toBe('hello-world');
  });
  it('パスカルケースをケバブケースに変換する', () => {
    expect(toKebab('HelloWorld')).toBe('hello-world');
  });
  it('スネークケースをケバブケースに変換する', () => {
    expect(toKebab('hello_world')).toBe('hello-world');
  });
  it('キャメルケースをケバブケースに変換する', () => {
    expect(toKebab('helloWorld')).toBe('hello-world');
  });
  it('空文字は空文字を返す', () => {
    expect(toKebab('')).toBe('');
  });
});

// =====================
// MD ラッパー
// =====================
describe('wrapHeading', () => {
  it('テキストを ## で囲む', () => {
    expect(wrapHeading('タイトル')).toBe('## タイトル');
  });
  it('複数行の場合、各行に ## を付ける', () => {
    expect(wrapHeading('行A\n行B')).toBe('## 行A\n## 行B');
  });
  it('空文字は ## のみを返す', () => {
    expect(wrapHeading('')).toBe('## ');
  });
});

describe('wrapCodeBlock', () => {
  it('テキストをコードブロックで囲む', () => {
    expect(wrapCodeBlock('const x = 1')).toBe('```\nconst x = 1\n```');
  });
  it('複数行のコードも正しく囲む', () => {
    expect(wrapCodeBlock('a\nb')).toBe('```\na\nb\n```');
  });
  it('空文字も囲む', () => {
    expect(wrapCodeBlock('')).toBe('```\n\n```');
  });
});

describe('wrapDivider', () => {
  it('テキストを --- で囲む', () => {
    expect(wrapDivider('本文')).toBe('---\n本文\n---');
  });
  it('空文字も囲む', () => {
    expect(wrapDivider('')).toBe('---\n\n---');
  });
});

describe('wrapMdDoc', () => {
  it('## + コードブロック + --- を一発で適用する', () => {
    const result = wrapMdDoc('const x = 1');
    expect(result).toContain('## ');
    expect(result).toContain('```');
    expect(result).toContain('const x = 1');
    expect(result).toContain('---');
  });
  it('出力は ## で始まり --- で終わる', () => {
    const result = wrapMdDoc('test');
    expect(result.startsWith('## ')).toBe(true);
    expect(result.endsWith('---')).toBe(true);
  });
});

// =====================
// JSON 整形
// =====================
describe('formatJson', () => {
  it('圧縮 JSON を 2 スペースでインデントして整形する', () => {
    expect(formatJson('{"a":1,"b":2}')).toBe('{\n  "a": 1,\n  "b": 2\n}');
  });
  it('不正な JSON は null を返す', () => {
    expect(formatJson('not json')).toBeNull();
  });
  it('空文字は null を返す', () => {
    expect(formatJson('')).toBeNull();
  });
});

// =====================
// スペース整形
// =====================
describe('normalizeSpaces', () => {
  it('行内の複数スペースを1つにまとめる', () => {
    expect(normalizeSpaces('hello   world')).toBe('hello world');
  });
  it('タブを1つのスペースに変換する', () => {
    expect(normalizeSpaces('hello\tworld')).toBe('hello world');
  });
  it('スペースとタブの混在を1つにまとめる', () => {
    expect(normalizeSpaces('hello \t  world')).toBe('hello world');
  });
  it('全角スペースを1つの半角スペースに変換する', () => {
    expect(normalizeSpaces('hello　world')).toBe('hello world');
  });
  it('改行は維持される', () => {
    expect(normalizeSpaces('hello  world\nfoo  bar')).toBe('hello world\nfoo bar');
  });
  it('各行の先頭・末尾の余分なスペースを除去する', () => {
    expect(normalizeSpaces('  hello world  \n  foo bar  ')).toBe('hello world\nfoo bar');
  });
  it('空文字は空文字を返す', () => {
    expect(normalizeSpaces('')).toBe('');
  });
  it('空白のみの行は空行になる', () => {
    expect(normalizeSpaces('hello\n   \nworld')).toBe('hello\n\nworld');
  });
});

// =====================
// 箇条書き
// =====================
describe('toBulletList', () => {
  it('各行の先頭に "- [ ] " を付ける', () => {
    expect(toBulletList('foo\nbar', '- [ ]')).toBe('- [ ] foo\n- [ ] bar');
  });
  it('各行の先頭に "- " を付ける', () => {
    expect(toBulletList('foo\nbar', '-')).toBe('- foo\n- bar');
  });
  it('各行の先頭に "・" を付ける', () => {
    expect(toBulletList('foo\nbar', '・')).toBe('・foo\n・bar');
  });
  it('行頭の半角スペースを維持してbulletを付ける', () => {
    expect(toBulletList('  hello', '-')).toBe('  - hello');
  });
  it('行頭の全角スペースを維持してbulletを付ける', () => {
    expect(toBulletList('　hello', '-')).toBe('　- hello');
  });
  it('空行にはbulletを付けない', () => {
    expect(toBulletList('foo\n\nbar', '-')).toBe('- foo\n\n- bar');
  });
  it('スペースのみの行にはbulletを付けない', () => {
    expect(toBulletList('foo\n   \nbar', '-')).toBe('- foo\n   \n- bar');
  });
  it('空文字は空文字を返す', () => {
    expect(toBulletList('', '-')).toBe('');
  });
});

// =====================
// ワンライナー
// =====================
describe('toOneLiner', () => {
  it('改行を半角スペース1つに変換する', () => {
    expect(toOneLiner('hello\nworld')).toBe('hello world');
  });
  it('タブを半角スペース1つに変換する', () => {
    expect(toOneLiner('hello\tworld')).toBe('hello world');
  });
  it('複数の空白文字をまとめて半角スペース1つに変換する', () => {
    expect(toOneLiner('hello   world')).toBe('hello world');
  });
  it('改行・タブ・スペースの混在をまとめて変換する', () => {
    expect(toOneLiner('SELECT\n  id,\n\tname\nFROM\n  users')).toBe('SELECT id, name FROM users');
  });
  it('先頭・末尾の空白を除去する', () => {
    expect(toOneLiner('  hello world  ')).toBe('hello world');
  });
  it('空文字は空文字を返す', () => {
    expect(toOneLiner('')).toBe('');
  });
  it('\\r\\n（Windows改行）も変換する', () => {
    expect(toOneLiner('hello\r\nworld')).toBe('hello world');
  });
});

// =====================
// SQL 整形
// =====================
describe('formatSql', () => {
  it('SELECT 文のキーワードを大文字・改行付きで整形する', () => {
    const result = formatSql('select id from users where id = 1');
    expect(result).toContain('SELECT');
    expect(result).toContain('FROM');
    expect(result).toContain('WHERE');
  });
  it('LEFT JOIN が行頭にまとまって出力される', () => {
    const result = formatSql('select id from users left join orders on users.id = orders.user_id');
    expect(result).toContain('\nLEFT JOIN');
    expect(result).not.toMatch(/LEFT\s*\n\s*JOIN/);
  });
  it('空文字は空文字を返す', () => {
    expect(formatSql('')).toBe('');
  });
});
