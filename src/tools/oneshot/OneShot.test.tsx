import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as helpers from './helpers';
import OneShot from './OneShot';

// copyToClipboard をコンポーネントテストレベルでモック
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let copyToClipboardSpy: ReturnType<typeof vi.fn>;

const setup = (dark = false) => {
  const user = userEvent.setup();
  const utils = render(<OneShot dark={dark} />);
  return { user, ...utils };
};

// user.type は [ ] を特殊キーとして解釈するため、fireEvent.change でテキストをセットする
const addPrompt = async (user: ReturnType<typeof userEvent.setup>, text: string) => {
  await user.click(screen.getByRole('button', { name: /新しいプロンプトを追加/ }));
  const textarea = screen.getByPlaceholderText('プロンプト本文...');
  fireEvent.change(textarea, { target: { value: text } });
  await user.click(screen.getByRole('button', { name: /^追加$/ }));
};

beforeEach(() => {
  localStorage.clear();
  copyToClipboardSpy = vi.spyOn(helpers, 'copyToClipboard').mockResolvedValue(true);
});

afterEach(() => {
  vi.restoreAllMocks();
});

// =====================
// レンダリング
// =====================
describe('レンダリング', () => {
  it('初期状態で空状態メッセージを表示する', () => {
    setup();
    expect(screen.getByText('プロンプトがまだありません')).toBeInTheDocument();
  });

  it('dark=true のとき .dark クラスが付く', () => {
    const { container } = setup(true);
    expect(container.querySelector('.oneshot')).toHaveClass('dark');
  });

  it('dark=false のとき .light クラスが付く', () => {
    const { container } = setup(false);
    expect(container.querySelector('.oneshot')).toHaveClass('light');
  });

  it('ヘッダーにロゴが表示される', () => {
    setup();
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });

  it('プロンプト件数バッジが 0 prompts で表示される', () => {
    setup();
    expect(screen.getByText('0 prompts')).toBeInTheDocument();
  });

  it('localStorage にデータがある場合、起動時に復元される', () => {
    localStorage.setItem('oneshot-prompts', JSON.stringify([
      { id: 'x', body: '復元されたプロンプト', replies: [], sent: false, createdAt: 1, updatedAt: 1 },
    ]));
    setup();
    expect(screen.getByText('復元されたプロンプト')).toBeInTheDocument();
  });
});

// =====================
// プロンプト追加
// =====================
describe('プロンプト追加', () => {
  it('「新しいプロンプトを追加」ボタンでフォームが開く', async () => {
    const { user } = setup();
    await user.click(screen.getByRole('button', { name: /新しいプロンプトを追加/ }));
    expect(screen.getByPlaceholderText('プロンプト本文...')).toBeInTheDocument();
  });

  it('本文を入力して追加するとプロンプトが表示される', async () => {
    const { user } = setup();
    await addPrompt(user, 'テストプロンプト本文');
    expect(screen.getByText('テストプロンプト本文')).toBeInTheDocument();
  });

  it('追加後にバッジが 1 prompts になる', async () => {
    const { user } = setup();
    await addPrompt(user, 'ABC');
    expect(screen.getByText('1 prompts')).toBeInTheDocument();
  });

  it('空の本文ではプロンプトが追加されない（フォームが閉じない）', async () => {
    const { user } = setup();
    await user.click(screen.getByRole('button', { name: /新しいプロンプトを追加/ }));
    await user.click(screen.getByRole('button', { name: /^追加$/ }));
    expect(screen.getByPlaceholderText('プロンプト本文...')).toBeInTheDocument();
    expect(screen.getByText('0 prompts')).toBeInTheDocument();
  });

  it('キャンセルするとフォームが閉じる', async () => {
    const { user } = setup();
    await user.click(screen.getByRole('button', { name: /新しいプロンプトを追加/ }));
    await user.click(screen.getByRole('button', { name: /キャンセル/ }));
    expect(screen.queryByPlaceholderText('プロンプト本文...')).not.toBeInTheDocument();
  });

  it('追加後はフォームが閉じる', async () => {
    const { user } = setup();
    await addPrompt(user, '新しいプロンプト');
    expect(screen.queryByPlaceholderText('プロンプト本文...')).not.toBeInTheDocument();
  });

  it('追加後は空状態メッセージが消える', async () => {
    const { user } = setup();
    await addPrompt(user, 'なにかのプロンプト');
    expect(screen.queryByText('プロンプトがまだありません')).not.toBeInTheDocument();
  });
});

// =====================
// プロンプト編集
// =====================
describe('プロンプト編集', () => {
  it('編集ボタンでテキストエリアが表示される', async () => {
    const { user } = setup();
    await addPrompt(user, '編集前テキスト');
    await user.click(screen.getByRole('button', { name: '編集' }));
    expect(screen.getByDisplayValue('編集前テキスト')).toBeInTheDocument();
  });

  it('編集して保存するとプロンプト本文が更新される', async () => {
    const { user } = setup();
    await addPrompt(user, '元のテキスト');
    await user.click(screen.getByRole('button', { name: '編集' }));
    const textarea = screen.getByDisplayValue('元のテキスト');
    fireEvent.change(textarea, { target: { value: '更新されたテキスト' } });
    await user.click(screen.getByRole('button', { name: /保存/ }));
    expect(screen.getByText('更新されたテキスト')).toBeInTheDocument();
    expect(screen.queryByText('元のテキスト')).not.toBeInTheDocument();
  });

  it('編集キャンセルで元の本文が表示される', async () => {
    const { user } = setup();
    await addPrompt(user, '元テキスト');
    await user.click(screen.getByRole('button', { name: '編集' }));
    await user.click(screen.getByRole('button', { name: /キャンセル/ }));
    expect(screen.getByText('元テキスト')).toBeInTheDocument();
  });
});

// =====================
// Sent トグル
// =====================
describe('Sent トグル', () => {
  it('Mark Sent をクリックすると Sent に変わる', async () => {
    const { user } = setup();
    await addPrompt(user, 'テスト');
    await user.click(screen.getByRole('button', { name: /Mark Sent/ }));
    expect(screen.getByRole('button', { name: /^Sent$/ })).toBeInTheDocument();
  });

  it('Sent をもう一度クリックすると Mark Sent に戻る', async () => {
    const { user } = setup();
    await addPrompt(user, 'テスト');
    await user.click(screen.getByRole('button', { name: /Mark Sent/ }));
    await user.click(screen.getByRole('button', { name: /^Sent$/ }));
    expect(screen.getByRole('button', { name: /Mark Sent/ })).toBeInTheDocument();
  });
});

// =====================
// ゴミ箱
// =====================
describe('ゴミ箱', () => {
  it('ゴミ箱に移動するとプロンプトがリストから消える', async () => {
    const { user } = setup();
    await addPrompt(user, '削除予定のプロンプト');
    await user.click(screen.getByRole('button', { name: 'ゴミ箱に移動' }));
    expect(screen.queryByText('削除予定のプロンプト')).not.toBeInTheDocument();
    expect(screen.getByText('0 prompts')).toBeInTheDocument();
  });

  it('ゴミ箱に移動するとバッジが表示される', async () => {
    const { user } = setup();
    await addPrompt(user, 'ゴミ箱テスト');
    await user.click(screen.getByRole('button', { name: 'ゴミ箱に移動' }));
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('ゴミ箱パネルを開いて復元できる', async () => {
    const { user } = setup();
    await addPrompt(user, '復元するプロンプト');
    await user.click(screen.getByRole('button', { name: 'ゴミ箱に移動' }));
    await user.click(screen.getByTitle('ゴミ箱'));
    await user.click(screen.getByRole('button', { name: /復元/ }));
    expect(screen.getByText('復元するプロンプト')).toBeInTheDocument();
  });

  it('ゴミ箱を空にするとパネルを再度開いたとき空メッセージが表示される', async () => {
    const { user } = setup();
    await addPrompt(user, '完全削除するプロンプト');
    await user.click(screen.getByRole('button', { name: 'ゴミ箱に移動' }));
    await user.click(screen.getByTitle('ゴミ箱'));
    await user.click(screen.getByRole('button', { name: /すべて削除/ }));
    // emptyTrash でパネルが閉じるので再度開く
    await user.click(screen.getByTitle('ゴミ箱'));
    expect(screen.getByText('ゴミ箱は空です')).toBeInTheDocument();
  });
});

// =====================
// リプライ
// =====================
describe('リプライ', () => {
  it('Reply ボタンでリプライ入力が表示される', async () => {
    const { user } = setup();
    await addPrompt(user, 'プロンプト');
    await user.click(screen.getByRole('button', { name: /Reply/ }));
    expect(screen.getByPlaceholderText('リプライを入力...')).toBeInTheDocument();
  });

  it('リプライを入力して Enter で送信するとリプライが表示される', async () => {
    const { user } = setup();
    await addPrompt(user, 'プロンプト');
    await user.click(screen.getByRole('button', { name: /Reply/ }));
    await user.type(screen.getByPlaceholderText('リプライを入力...'), 'これはリプライです{Enter}');
    expect(screen.getByText('これはリプライです')).toBeInTheDocument();
  });

  it('リプライを削除できる', async () => {
    const { user } = setup();
    await addPrompt(user, 'プロンプト');
    await user.click(screen.getByRole('button', { name: /Reply/ }));
    await user.type(screen.getByPlaceholderText('リプライを入力...'), '削除するリプライ{Enter}');
    await user.click(screen.getByRole('button', { name: 'リプライを削除' }));
    expect(screen.queryByText('削除するリプライ')).not.toBeInTheDocument();
  });

  it('リプライを解決すると resolved クラスが付く', async () => {
    const { user } = setup();
    await addPrompt(user, 'プロンプト');
    await user.click(screen.getByRole('button', { name: /Reply/ }));
    await user.type(screen.getByPlaceholderText('リプライを入力...'), '解決するリプライ{Enter}');
    await user.click(screen.getByRole('button', { name: 'リプライを解決' }));
    expect(screen.getByText('解決するリプライ').closest('.os-reply')).toHaveClass('resolved');
  });
});

// =====================
// コピー
// =====================
describe('コピー', () => {
  it('コピーボタンで copyToClipboard がプロンプト本文を引数に呼ばれる', async () => {
    const { user } = setup();
    await addPrompt(user, 'コピー対象テキスト');
    await user.click(screen.getByRole('button', { name: 'コピー' }));
    expect(copyToClipboardSpy).toHaveBeenCalledWith('コピー対象テキスト');
  });
});

// =====================
// 複数プロンプト
// =====================
describe('複数プロンプト', () => {
  it('複数追加すると件数が正しく表示される', async () => {
    const { user } = setup();
    await addPrompt(user, 'プロンプト1');
    await addPrompt(user, 'プロンプト2');
    await addPrompt(user, 'プロンプト3');
    expect(screen.getByText('3 prompts')).toBeInTheDocument();
  });

  it('最新追加したプロンプトが先頭のバブルに表示される', async () => {
    const { user } = setup();
    await addPrompt(user, '古いプロンプト');
    await addPrompt(user, '新しいプロンプト');
    const bodies = screen.getAllByText(/プロンプト/);
    expect(bodies[0].textContent).toContain('新しい');
  });
});

// =====================
// localStorage 永続化
// =====================
describe('localStorage 永続化', () => {
  it('プロンプト追加後 localStorage に保存される', async () => {
    const { user } = setup();
    await addPrompt(user, '保存テスト');
    const stored = JSON.parse(localStorage.getItem('oneshot-prompts') ?? '[]');
    expect(stored[0].body).toBe('保存テスト');
  });

  it('ゴミ箱に移動後も localStorage に trashedAt が反映される', async () => {
    const { user } = setup();
    await addPrompt(user, 'トラッシュ保存テスト');
    await user.click(screen.getByRole('button', { name: 'ゴミ箱に移動' }));
    const stored = JSON.parse(localStorage.getItem('oneshot-prompts') ?? '[]');
    expect(stored[0].trashedAt).toBeDefined();
  });
});

// =====================
// Distill ツールバー
// =====================
describe('Distill ボタン', () => {
  it('DISTILL ボタンが表示される', () => {
    setup();
    expect(screen.getByRole('button', { name: /DISTILL/ })).toBeInTheDocument();
  });

  it('プロンプトが 1 件のとき DISTILL を押すと copyToClipboard が呼ばれる', async () => {
    const { user } = setup();
    await addPrompt(user, 'テスト');
    await user.click(screen.getByRole('button', { name: /DISTILL/ }));
    expect(copyToClipboardSpy).toHaveBeenCalledOnce();
  });

  it('プロンプトが 0 件のとき DISTILL を押しても copyToClipboard は呼ばれない', async () => {
    const { user } = setup();
    await user.click(screen.getByRole('button', { name: /DISTILL/ }));
    expect(copyToClipboardSpy).not.toHaveBeenCalled();
  });
});

// =====================
// チェックボックス構文
// =====================
describe('チェックボックス構文', () => {
  it('- [ ] 構文がチェックボックスとしてレンダリングされる', async () => {
    const { user } = setup();
    await addPrompt(user, '- [ ] タスクA');
    expect(screen.getByText('タスクA')).toBeInTheDocument();
    expect(screen.getByText('タスクA').closest('.os-body-check')).not.toHaveClass('checked');
  });

  it('チェックボックスをクリックすると checked になる', async () => {
    const { user } = setup();
    await addPrompt(user, '- [ ] タスクB');
    await user.click(screen.getByText('タスクB').closest('.os-body-check')!);
    expect(screen.getByText('タスクB').closest('.os-body-check')).toHaveClass('checked');
  });

  it('- [x] 構文が checked 状態でレンダリングされる', async () => {
    localStorage.setItem('oneshot-prompts', JSON.stringify([
      { id: 'cb', body: '- [x] 完了タスク', replies: [], sent: false, createdAt: 1, updatedAt: 1 },
    ]));
    setup();
    expect(screen.getByText('完了タスク').closest('.os-body-check')).toHaveClass('checked');
  });
});