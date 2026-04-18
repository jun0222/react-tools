import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { ThemeProvider } from '../../context/ThemeContext';
import * as phantom from './phantomCore';
import Phantom from './Phantom';

let copyTextSpy: ReturnType<typeof vi.fn>;

const setup = (dark = true) => {
  localStorage.setItem('oneshot-theme', dark ? 'dark' : 'light');
  const user = userEvent.setup();
  const utils = render(
    <ThemeProvider>
      <Phantom />
    </ThemeProvider>
  );
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

  it('ダークモードのとき .dark クラスが付く', () => {
    const { container } = setup(true);
    expect(container.querySelector('.ph-root')).toHaveClass('dark');
  });

  it('ライトモードのとき .light クラスが付く', () => {
    const { container } = setup(false);
    expect(container.querySelector('.ph-root')).toHaveClass('light');
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
// ランダムルール（対象文字列マッチング）
// =============================================
describe('ランダムルール', () => {
  it('ランダムタブに切り替えると「ルールを追加」ボタンが表示される', async () => {
    const { user } = setup();
    await user.click(screen.getByRole('button', { name: /ランダム/ }));
    expect(screen.getByRole('button', { name: /ルールを追加/ })).toBeInTheDocument();
  });

  it('ルール追加で対象文字列の入力が現れる', async () => {
    const { user } = setup();
    await user.click(screen.getByRole('button', { name: /ランダム/ }));
    await user.click(screen.getByRole('button', { name: /ルールを追加/ }));
    expect(screen.getByPlaceholderText(/対象文字列/)).toBeInTheDocument();
  });

  it('対象文字列を入力すると一致部分だけが変換される（外側は不変）', async () => {
    const { user, container } = setup();
    fireEvent.change(screen.getByPlaceholderText('テキストを入力...'), {
      target: { value: 'this is ka3afai' },
    });
    await user.click(screen.getByRole('button', { name: /ランダム/ }));
    await user.click(screen.getByRole('button', { name: /ルールを追加/ }));
    fireEvent.change(screen.getByPlaceholderText(/対象文字列/), { target: { value: 'ka3afai' } });
    const output = getOutput(container);
    // 'this is ' の部分は変換されない
    expect(output.substring(0, 8)).toBe('this is ');
    // 'ka3afai' の部分が変換されている
    expect(output).toHaveLength(15);
    expect(output.substring(8)).not.toBe('ka3afai');
  });

  it('削除ボタンでルールが消え OUTPUT が元に戻る', async () => {
    const { user, container } = setup();
    fireEvent.change(screen.getByPlaceholderText('テキストを入力...'), {
      target: { value: 'hello' },
    });
    await user.click(screen.getByRole('button', { name: /ランダム/ }));
    await user.click(screen.getByRole('button', { name: /ルールを追加/ }));
    fireEvent.change(screen.getByPlaceholderText(/対象文字列/), { target: { value: 'hello' } });
    expect(getOutput(container)).not.toBe('hello');
    await user.click(screen.getByRole('button', { name: 'ルールを削除' }));
    expect(getOutput(container)).toBe('hello');
  });

  it('置換と同時使用：置換済み文字列にランダムは反応しない', async () => {
    const { user, container } = setup();
    fireEvent.change(screen.getByPlaceholderText('テキストを入力...'), {
      target: { value: 'this is ka3afai' },
    });
    // 置換ペア: ka3afai → hoge
    fireEvent.change(screen.getByPlaceholderText('変換前'), { target: { value: 'ka3afai' } });
    fireEvent.change(screen.getByPlaceholderText('変換後'), { target: { value: 'hoge' } });
    // ランダムルール: ka3afai（置換後には存在しないので無反応）
    await user.click(screen.getByRole('button', { name: /ランダム/ }));
    await user.click(screen.getByRole('button', { name: /ルールを追加/ }));
    fireEvent.change(screen.getByPlaceholderText(/対象文字列/), { target: { value: 'ka3afai' } });
    // 結果は 'this is hoge'（'this is' も変わらない）
    expect(getOutput(container)).toBe('this is hoge');
  });
});