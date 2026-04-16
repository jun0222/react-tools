import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import * as phantom from './phantom';
import Phantom from './Phantom';

let copyTextSpy: ReturnType<typeof vi.fn>;

const setup = () => {
  const user = userEvent.setup();
  const utils = render(<Phantom />);
  return { user, ...utils };
};

const getOutput = (container: HTMLElement): string =>
  (container.querySelector('.ph-output') as HTMLElement)?.textContent ?? '';

beforeEach(() => {
  copyTextSpy = vi.spyOn(phantom, 'copyText').mockResolvedValue(true);
});

afterEach(() => {
  vi.restoreAllMocks();
});

// =============================================
// レンダリング
// =============================================
describe('レンダリング', () => {
  it('PHANTOM ヘッダーが表示される', () => {
    setup();
    expect(screen.getByText(/phantom/i)).toBeInTheDocument();
  });

  it('入力テキストエリアが表示される', () => {
    setup();
    expect(screen.getByPlaceholderText('テキストを入力...')).toBeInTheDocument();
  });

  it('出力エリア（.ph-output）が表示される', () => {
    const { container } = setup();
    expect(container.querySelector('.ph-output')).toBeInTheDocument();
  });

  it('置換タブとランダムタブが表示される', () => {
    setup();
    expect(screen.getByRole('button', { name: /置換/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /ランダム/ })).toBeInTheDocument();
  });

  it('初期状態で変換前・変換後の入力フィールドが1セット表示される', () => {
    setup();
    expect(screen.getByPlaceholderText('変換前')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('変換後')).toBeInTheDocument();
  });

  it('コピーボタンが表示される', () => {
    setup();
    expect(screen.getByRole('button', { name: /コピー/ })).toBeInTheDocument();
  });
});

// =============================================
// 入出力
// =============================================
describe('入出力', () => {
  it('入力テキストがそのまま出力に反映される（ルールなし）', () => {
    const { container } = setup();
    fireEvent.change(screen.getByPlaceholderText('テキストを入力...'), {
      target: { value: 'hello world' },
    });
    expect(getOutput(container)).toBe('hello world');
  });

  it('入力が空のとき出力も空', () => {
    const { container } = setup();
    fireEvent.change(screen.getByPlaceholderText('テキストを入力...'), {
      target: { value: '' },
    });
    expect(getOutput(container)).toBe('');
  });

  it('コピーボタンで copyText が出力内容を引数に呼ばれる', async () => {
    const { user, container } = setup();
    fireEvent.change(screen.getByPlaceholderText('テキストを入力...'), {
      target: { value: 'test output' },
    });
    await user.click(screen.getByRole('button', { name: /コピー/ }));
    expect(copyTextSpy).toHaveBeenCalledWith(getOutput(container));
  });
});

// =============================================
// 置換ペア
// =============================================
describe('置換ペア', () => {
  it('「ペアを追加」ボタンで置換フォームが増える', async () => {
    const { user } = setup();
    await user.click(screen.getByRole('button', { name: /ペアを追加/ }));
    expect(screen.getAllByPlaceholderText('変換前')).toHaveLength(2);
  });

  it('変換前/変換後を入力すると出力が変換される', () => {
    const { container } = setup();
    fireEvent.change(screen.getByPlaceholderText('テキストを入力...'), {
      target: { value: 'hello world' },
    });
    fireEvent.change(screen.getByPlaceholderText('変換前'), { target: { value: 'hello' } });
    fireEvent.change(screen.getByPlaceholderText('変換後'), { target: { value: 'bye' } });
    expect(getOutput(container)).toBe('bye world');
  });

  it('複数ペアが順番に適用される', async () => {
    const { user, container } = setup();
    fireEvent.change(screen.getByPlaceholderText('テキストを入力...'), {
      target: { value: 'aaa' },
    });
    fireEvent.change(screen.getByPlaceholderText('変換前'), { target: { value: 'a' } });
    fireEvent.change(screen.getByPlaceholderText('変換後'), { target: { value: 'b' } });
    await user.click(screen.getByRole('button', { name: /ペアを追加/ }));
    const froms = screen.getAllByPlaceholderText('変換前');
    const tos = screen.getAllByPlaceholderText('変換後');
    fireEvent.change(froms[1], { target: { value: 'b' } });
    fireEvent.change(tos[1], { target: { value: 'c' } });
    // a→b→c: 'aaa' → 'ccc'
    expect(getOutput(container)).toBe('ccc');
  });

  it('削除ボタンでペアが消える', async () => {
    const { user } = setup();
    await user.click(screen.getByRole('button', { name: /ペアを追加/ }));
    expect(screen.getAllByPlaceholderText('変換前')).toHaveLength(2);
    await user.click(screen.getAllByRole('button', { name: 'ペアを削除' })[0]);
    expect(screen.getAllByPlaceholderText('変換前')).toHaveLength(1);
  });

  it('削除後は変換が適用されなくなる', async () => {
    const { user, container } = setup();
    fireEvent.change(screen.getByPlaceholderText('テキストを入力...'), {
      target: { value: 'hello' },
    });
    fireEvent.change(screen.getByPlaceholderText('変換前'), { target: { value: 'hello' } });
    fireEvent.change(screen.getByPlaceholderText('変換後'), { target: { value: 'bye' } });
    expect(getOutput(container)).toBe('bye');
    await user.click(screen.getByRole('button', { name: 'ペアを削除' }));
    expect(getOutput(container)).toBe('hello');
  });
});

// =============================================
// ランダムルール
// =============================================
describe('ランダムルール', () => {
  it('ランダムタブに切り替えると「ルールを追加」ボタンが表示される', async () => {
    const { user } = setup();
    await user.click(screen.getByRole('button', { name: /ランダム/ }));
    expect(screen.getByRole('button', { name: /ルールを追加/ })).toBeInTheDocument();
  });

  it('ルール追加で対象文字・変換先の入力が現れる', async () => {
    const { user } = setup();
    await user.click(screen.getByRole('button', { name: /ランダム/ }));
    await user.click(screen.getByRole('button', { name: /ルールを追加/ }));
    expect(screen.getByPlaceholderText('対象文字')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/変換先/)).toBeInTheDocument();
  });

  it('変換先が1文字のとき全対象文字がその文字に変換される', async () => {
    const { user, container } = setup();
    fireEvent.change(screen.getByPlaceholderText('テキストを入力...'), {
      target: { value: 'hello' },
    });
    await user.click(screen.getByRole('button', { name: /ランダム/ }));
    await user.click(screen.getByRole('button', { name: /ルールを追加/ }));
    fireEvent.change(screen.getByPlaceholderText('対象文字'), { target: { value: 'aeiou' } });
    fireEvent.change(screen.getByPlaceholderText(/変換先/), { target: { value: '★' } });
    expect(getOutput(container)).toBe('h★ll★');
  });

  it('削除ボタンでルールが消える', async () => {
    const { user } = setup();
    await user.click(screen.getByRole('button', { name: /ランダム/ }));
    await user.click(screen.getByRole('button', { name: /ルールを追加/ }));
    await user.click(screen.getByRole('button', { name: /ルールを追加/ }));
    expect(screen.getAllByPlaceholderText('対象文字')).toHaveLength(2);
    await user.click(screen.getAllByRole('button', { name: 'ルールを削除' })[0]);
    expect(screen.getAllByPlaceholderText('対象文字')).toHaveLength(1);
  });

  it('プリセットボタンをクリックすると変換先に文字セットが設定される', async () => {
    const { user } = setup();
    await user.click(screen.getByRole('button', { name: /ランダム/ }));
    await user.click(screen.getByRole('button', { name: /ルールを追加/ }));
    // ?マスク プリセット
    await user.click(screen.getByRole('button', { name: /^?$/ }));
    expect(
      (screen.getByPlaceholderText(/変換先/) as HTMLInputElement).value
    ).toBe('?');
  });
});
