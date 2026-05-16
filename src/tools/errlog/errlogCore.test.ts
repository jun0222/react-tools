import { describe, it, expect } from 'vitest';
import {
  generatePrompt, extractMermaid,
  generateFilename, generateMarkdown,
} from './errlogCore';

describe('generatePrompt', () => {
  it('エラー内容が含まれる', () => {
    const prompt = generatePrompt('TypeError: foo is not defined');
    expect(prompt).toContain('TypeError: foo is not defined');
  });

  it('mermaid flowchart TD の指示が含まれる', () => {
    const prompt = generatePrompt('some error');
    expect(prompt).toContain('mermaid');
    expect(prompt).toContain('flowchart TD');
  });

  it('bash/sql/typescript のコードブロック指示が含まれる', () => {
    const prompt = generatePrompt('some error');
    expect(prompt).toContain('```bash');
    expect(prompt).toContain('```sql');
    expect(prompt).toContain('```typescript');
  });

  it('4つのセクションが含まれる', () => {
    const prompt = generatePrompt('err');
    expect(prompt).toContain('## 1. エラーフロー');
    expect(prompt).toContain('## 2. 原因分析');
    expect(prompt).toContain('## 3. 解決策');
    expect(prompt).toContain('## 4. 再発防止策');
  });
});

describe('extractMermaid', () => {
  it('mermaidブロックを抽出できる', () => {
    const response = 'text\n```mermaid\nflowchart TD\n  A --> B\n```\nmore';
    expect(extractMermaid(response)).toBe('flowchart TD\n  A --> B');
  });

  it('mermaidブロックがない場合はnullを返す', () => {
    expect(extractMermaid('no mermaid here')).toBeNull();
  });

  it('先頭と末尾の空白をトリムする', () => {
    const response = '```mermaid\n  flowchart TD\n  A --> B\n  \n```';
    expect(extractMermaid(response)).toBe('flowchart TD\n  A --> B');
  });
});

describe('generateFilename', () => {
  it('errlog- で始まる .md ファイル名を返す', () => {
    const name = generateFilename();
    expect(name).toMatch(/^errlog-\d{4}_\d{2}_\d{2}_\d{4}_\d{2}\.md$/);
  });
});

describe('generateMarkdown', () => {
  it('タイトルが H1 見出しになる', () => {
    const md = generateMarkdown('テストエラー', 'err', 'resp');
    expect(md).toContain('# テストエラー');
  });

  it('タイトルが空のときエラー文の先頭をタイトルにする', () => {
    const md = generateMarkdown('', 'TypeError: foo', 'resp');
    expect(md).toContain('# TypeError: foo');
  });

  it('タイトルが空でエラー文が長いとき60文字で切る', () => {
    const md = generateMarkdown('', 'E'.repeat(80), 'resp');
    const titleLine = md.split('\n')[0];
    expect(titleLine).toBe('# ' + 'E'.repeat(60));
  });

  it('エラー内容がコードブロックに含まれる', () => {
    const md = generateMarkdown('t', 'some error text', 'resp');
    expect(md).toContain('```\nsome error text\n```');
  });

  it('LLMの返答がそのまま含まれる', () => {
    const md = generateMarkdown('t', 'err', 'my llm response');
    expect(md).toContain('my llm response');
  });

  it('記録日時が含まれる', () => {
    const md = generateMarkdown('t', 'err', 'resp');
    expect(md).toContain('記録日時:');
  });
});
