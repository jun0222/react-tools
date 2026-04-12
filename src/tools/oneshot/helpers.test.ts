import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  getShotTitle,
  loadPrompts,
  savePrompts,
  uid,
  findDuplicateIds,
  buildGlobalDistillPrompt,
  copyToClipboard,
  exportPrompts,
  importPrompts,
} from './helpers';
import type { PromptEntry } from './helpers';

// --- fixtures ---
const makePrompt = (overrides: Partial<PromptEntry> = {}): PromptEntry => ({
  id: 'test-id',
  body: 'テストプロンプト本文',
  replies: [],
  sent: false,
  createdAt: 1000,
  updatedAt: 1000,
  ...overrides,
});

// =====================
// getShotTitle
// =====================
describe('getShotTitle', () => {
  it('0件のとき "Zero" を返す', () => {
    expect(getShotTitle(0)).toBe('Zero');
  });

  it('1〜10件は英語の数詞を返す', () => {
    expect(getShotTitle(1)).toBe('One');
    expect(getShotTitle(5)).toBe('Five');
    expect(getShotTitle(10)).toBe('Ten');
  });

  it('11件以上は数字の文字列を返す', () => {
    expect(getShotTitle(11)).toBe('11');
    expect(getShotTitle(99)).toBe('99');
  });
});

// =====================
// uid
// =====================
describe('uid', () => {
  it('空でない文字列を返す', () => {
    expect(uid()).toBeTruthy();
  });

  it('毎回ユニークな値を返す', () => {
    const ids = Array.from({ length: 100 }, uid);
    const unique = new Set(ids);
    expect(unique.size).toBe(100);
  });
});

// =====================
// savePrompts / loadPrompts
// =====================
describe('savePrompts / loadPrompts', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('保存したプロンプトをそのまま読み込める', () => {
    const prompts = [makePrompt({ id: 'a' }), makePrompt({ id: 'b' })];
    savePrompts(prompts);
    expect(loadPrompts()).toEqual(prompts);
  });

  it('何も保存していないとき空配列を返す', () => {
    expect(loadPrompts()).toEqual([]);
  });

  it('LocalStorage が壊れていても空配列を返す（フォールバック）', () => {
    localStorage.setItem('oneshot-prompts', 'invalid json {{{');
    expect(loadPrompts()).toEqual([]);
  });

  it('trashedAt を持つプロンプトも正しく永続化される', () => {
    const trashed = makePrompt({ id: 'x', trashedAt: 9999 });
    savePrompts([trashed]);
    const loaded = loadPrompts();
    expect(loaded[0].trashedAt).toBe(9999);
  });
});

// =====================
// findDuplicateIds
// =====================
describe('findDuplicateIds', () => {
  it('重複がなければ空配列を返す', () => {
    const existing = [makePrompt({ id: 'a' }), makePrompt({ id: 'b' })];
    const incoming = [makePrompt({ id: 'c' }), makePrompt({ id: 'd' })];
    expect(findDuplicateIds(incoming, existing)).toEqual([]);
  });

  it('重複するIDをすべて返す', () => {
    const existing = [makePrompt({ id: 'a' }), makePrompt({ id: 'b' })];
    const incoming = [makePrompt({ id: 'a' }), makePrompt({ id: 'c' }), makePrompt({ id: 'b' })];
    expect(findDuplicateIds(incoming, existing)).toEqual(['a', 'b']);
  });

  it('既存が空のとき常に空配列を返す', () => {
    const incoming = [makePrompt({ id: 'x' })];
    expect(findDuplicateIds(incoming, [])).toEqual([]);
  });

  it('incomingが空のとき常に空配列を返す', () => {
    const existing = [makePrompt({ id: 'a' })];
    expect(findDuplicateIds([], existing)).toEqual([]);
  });
});

// =====================
// buildGlobalDistillPrompt
// =====================
describe('buildGlobalDistillPrompt', () => {
  it('件数がヘッダーに含まれる', () => {
    const prompts = [makePrompt(), makePrompt()];
    const result = buildGlobalDistillPrompt(prompts);
    expect(result).toContain('2件');
  });

  it('各プロンプトの本文が含まれる', () => {
    const prompts = [makePrompt({ body: 'プロンプトABC' })];
    const result = buildGlobalDistillPrompt(prompts);
    expect(result).toContain('プロンプトABC');
  });

  it('リプライがあれば Replies セクションが含まれる', () => {
    const prompt = makePrompt({
      replies: [{ id: 'r1', text: 'リプライ内容', createdAt: 0, resolved: false }],
    });
    const result = buildGlobalDistillPrompt([prompt]);
    expect(result).toContain('**Replies:**');
    expect(result).toContain('リプライ内容');
  });

  it('resolved なリプライには [RESOLVED] が付く', () => {
    const prompt = makePrompt({
      replies: [{ id: 'r1', text: '解決済み', createdAt: 0, resolved: true }],
    });
    const result = buildGlobalDistillPrompt([prompt]);
    expect(result).toContain('[RESOLVED]');
  });

  it('リプライがなければ Replies セクションは含まれない', () => {
    const result = buildGlobalDistillPrompt([makePrompt()]);
    expect(result).not.toContain('**Replies:**');
  });
});

// =====================
// copyToClipboard
// =====================
describe('copyToClipboard', () => {
  it('clipboard.writeText が成功したとき true を返す', async () => {
    vi.stubGlobal('navigator', {
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
    expect(await copyToClipboard('hello')).toBe(true);
  });

  it('clipboard.writeText が失敗したとき false を返す', async () => {
    vi.stubGlobal('navigator', {
      clipboard: { writeText: vi.fn().mockRejectedValue(new Error('denied')) },
    });
    expect(await copyToClipboard('hello')).toBe(false);
  });
});

// =====================
// exportPrompts
// =====================
describe('exportPrompts', () => {
  let clickSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn().mockReturnValue('blob:mock-url'),
      revokeObjectURL: vi.fn(),
    });
    clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
  });

  afterEach(() => {
    clickSpy.mockRestore();
    vi.unstubAllGlobals();
  });

  it('createObjectURL を呼び出してリンクをクリックする', () => {
    exportPrompts([makePrompt()]);
    expect(URL.createObjectURL).toHaveBeenCalledOnce();
    expect(clickSpy).toHaveBeenCalledOnce();
  });

  it('クリック後に revokeObjectURL でメモリを解放する', () => {
    exportPrompts([makePrompt()]);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
  });

  it('createObjectURL が呼ばれる（ファイル生成を間接的に確認）', () => {
    exportPrompts([makePrompt()]);
    expect(URL.createObjectURL).toHaveBeenCalledOnce();
  });
});

// =====================
// importPrompts
// =====================
describe('importPrompts', () => {
  afterEach(() => vi.restoreAllMocks());

  it('JSON ファイルを選択するとプロンプト配列を返す', async () => {
    const prompts = [makePrompt({ id: 'imported-1' }), makePrompt({ id: 'imported-2' })];
    const fileContent = JSON.stringify(prompts);

    vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(function (this: HTMLInputElement) {
      const file = new File([fileContent], 'test.json', { type: 'application/json' });
      Object.defineProperty(this, 'files', { value: [file], configurable: true });
      this.dispatchEvent(new Event('change'));
    });

    const result = await importPrompts();
    expect(result).toEqual(prompts);
  });

  it('不正な JSON のとき reject する', async () => {
    vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(function (this: HTMLInputElement) {
      const file = new File(['invalid json {{{'], 'bad.json', { type: 'application/json' });
      Object.defineProperty(this, 'files', { value: [file], configurable: true });
      this.dispatchEvent(new Event('change'));
    });

    await expect(importPrompts()).rejects.toThrow();
  });

  it('ファイルが選択されなかったとき reject する', async () => {
    vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(function (this: HTMLInputElement) {
      Object.defineProperty(this, 'files', { value: [], configurable: true });
      this.dispatchEvent(new Event('change'));
    });

    await expect(importPrompts()).rejects.toThrow('No file');
  });
});