import { describe, it, expect } from 'vitest';
import { TEMPLATES, findTemplate } from './cannedCore';

describe('TEMPLATES', () => {
  it('grill-meテンプレートが登録されている', () => {
    expect(TEMPLATES.some(t => t.name === 'grill-me')).toBe(true);
  });
});

describe('findTemplate', () => {
  it('名前を指定するとテンプレートが見つかる', () => {
    const t = findTemplate('grill-me');
    expect(t?.text).toContain('質問は一度に一つずつ');
  });

  it('存在しない名前はundefinedを返す', () => {
    expect(findTemplate('nonexistent')).toBeUndefined();
  });
});
