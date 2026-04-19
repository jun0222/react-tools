import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ThemeProvider } from '../../context/ThemeContext';
import * as helpers from './helpers';
import OneShot from './OneShot';

// copyToClipboard をコンポーネントテストレベルでモック
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let copyToClipboardSpy: ReturnType<typeof vi.fn>;

const setup = (dark = false) => {
  localStorage.setItem('oneshot-theme', dark ? 'dark' : 'light');
  const user = userEvent.setup();
  const utils = render(
    <ThemeProvider>
      <OneShot />
    </ThemeProvider>
  );
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

// =====================
// フィルタ
// =====================
describe('フィルタ', () => {
  it('フィルタボタン（すべて・未送信・送信済み）が表示される', () => {
    setup();
    expect(screen.getByRole('button', { name: /^すべて$/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^未送信$/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^送信済み$/ })).toBeInTheDocument();
  });

  it('「未送信」フィルタで未送信プロンプトのみ表示される', async () => {
    const { user } = setup();
    await addPrompt(user, 'A未送信');
    await addPrompt(user, 'B送信済み'); // 最新が先頭
    // 先頭の "B送信済み" を Mark Sent
    await user.click(screen.getAllByRole('button', { name: /Mark Sent/ })[0]);

    await user.click(screen.getByRole('button', { name: /^未送信$/ }));

    expect(screen.getByText('A未送信')).toBeInTheDocument();
    expect(screen.queryByText('B送信済み')).not.toBeInTheDocument();
  });

  it('「送信済み」フィルタで送信済みプロンプトのみ表示される', async () => {
    const { user } = setup();
    await addPrompt(user, 'A未送信');
    await addPrompt(user, 'B送信済み');
    await user.click(screen.getAllByRole('button', { name: /Mark Sent/ })[0]);

    await user.click(screen.getByRole('button', { name: /^送信済み$/ }));

    expect(screen.queryByText('A未送信')).not.toBeInTheDocument();
    expect(screen.getByText('B送信済み')).toBeInTheDocument();
  });

  it('「すべて」フィルタで全プロンプトが表示される', async () => {
    const { user } = setup();
    await addPrompt(user, 'A未送信');
    await addPrompt(user, 'B送信済み');
    await user.click(screen.getAllByRole('button', { name: /Mark Sent/ })[0]);

    await user.click(screen.getByRole('button', { name: /^未送信$/ }));
    await user.click(screen.getByRole('button', { name: /^すべて$/ }));

    expect(screen.getByText('A未送信')).toBeInTheDocument();
    expect(screen.getByText('B送信済み')).toBeInTheDocument();
  });

  it('「解決済み」フィルターで解決済みプロンプトのみ表示される', async () => {
    const { user } = setup();
    await addPrompt(user, '未解決プロンプト');
    await addPrompt(user, '解決済みプロンプト');
    await user.click(screen.getAllByRole('button', { name: '解決済みにする' })[0]);
    await user.click(screen.getByRole('button', { name: /^解決済み$/ }));
    expect(screen.getByText('解決済みプロンプト')).toBeInTheDocument();
    expect(screen.queryByText('未解決プロンプト')).not.toBeInTheDocument();
  });

  it('「解決済み」フィルター中は折りたたまれた本文も展開されて表示される', async () => {
    const { user } = setup();
    await addPrompt(user, '確認用プロンプト本文');
    await user.click(screen.getByRole('button', { name: '解決済みにする' }));
    await user.click(screen.getByRole('button', { name: /^解決済み$/ }));
    expect(screen.getByText('確認用プロンプト本文')).toBeInTheDocument();
  });

  it('フィルタ中にプロンプトを追加すると「すべて」に戻って表示される', async () => {
    const { user } = setup();
    await addPrompt(user, '既存');
    await user.click(screen.getByRole('button', { name: /^未送信$/ }));
    await addPrompt(user, '新規追加');
    expect(screen.getByText('新規追加')).toBeInTheDocument();
    expect(screen.getByText('既存')).toBeInTheDocument();
  });
});

// =====================
// 編集テキストエリアの高さ（自動リサイズ）
// =====================
describe('編集テキストエリアの自動リサイズ', () => {
  let scrollHeightSpy: PropertyDescriptor | undefined;

  beforeEach(() => {
    scrollHeightSpy = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'scrollHeight');
    Object.defineProperty(HTMLElement.prototype, 'scrollHeight', {
      configurable: true,
      get: () => 200,
    });
  });

  afterEach(() => {
    if (scrollHeightSpy) {
      Object.defineProperty(HTMLElement.prototype, 'scrollHeight', scrollHeightSpy);
    }
  });

  it('編集ボタンを押した直後にテキストエリアの高さが scrollHeight に合わせて設定される', async () => {
    const { user } = setup();
    await addPrompt(user, '高さテスト用テキスト');
    await user.click(screen.getByRole('button', { name: '編集' }));

    const textarea = screen.getByDisplayValue('高さテスト用テキスト') as HTMLTextAreaElement;
    expect(textarea.style.height).toBe('200px');
  });

  it('一度キャンセルして同じプロンプトを再度編集しても高さが設定される', async () => {
    const { user } = setup();
    await addPrompt(user, '再編集テキスト');

    // 1回目編集→キャンセル
    await user.click(screen.getByRole('button', { name: '編集' }));
    await user.click(screen.getByRole('button', { name: /キャンセル/ }));

    // 2回目編集（editBody は前回と同じ値のまま）
    await user.click(screen.getByRole('button', { name: '編集' }));

    const textarea = screen.getByDisplayValue('再編集テキスト') as HTMLTextAreaElement;
    expect(textarea.style.height).toBe('200px');
  });
});

// =====================
// 貼り付け（コピペ）
// =====================
describe('貼り付け（コピペ）', () => {
  const makePasteEvent = (target: Element, text: string) => {
    const event = new Event('paste', { bubbles: true, cancelable: true });
    Object.defineProperty(event, 'clipboardData', {
      value: { getData: (_type: string) => text },
      configurable: true,
    });
    Object.defineProperty(event, 'currentTarget', {
      value: target,
      configurable: true,
    });
    return event;
  };

  it('新規フォームに貼り付けるとテキストが二重にならず一度だけ設定される', async () => {
    const { user } = setup();
    await user.click(screen.getByRole('button', { name: /新しいプロンプトを追加/ }));
    const textarea = screen.getByPlaceholderText('プロンプト本文...') as HTMLTextAreaElement;

    fireEvent(textarea, makePasteEvent(textarea, '貼り付けテキスト'));

    expect(textarea.value).toBe('貼り付けテキスト');
  });

  it('編集テキストエリアへの貼り付けでもコンテンツが二重にならない', async () => {
    const { user } = setup();
    await addPrompt(user, '元テキスト');
    await user.click(screen.getByRole('button', { name: '編集' }));
    const textarea = screen.getByDisplayValue('元テキスト') as HTMLTextAreaElement;

    // カーソルを末尾に設定して貼り付け
    textarea.selectionStart = textarea.value.length;
    textarea.selectionEnd = textarea.value.length;
    fireEvent(textarea, makePasteEvent(textarea, '追記'));

    expect(textarea.value).toBe('元テキスト追記');
  });
});

// =====================
// タグ
// =====================
describe('タグ', () => {
  it('新規フォームにタグ入力欄が表示される', async () => {
    const { user } = setup();
    await user.click(screen.getByRole('button', { name: /新しいプロンプトを追加/ }));
    expect(screen.getByPlaceholderText('タグ（カンマ区切り）')).toBeInTheDocument();
  });

  it('タグ付きで追加するとバブルにタグが表示される', async () => {
    const { user } = setup();
    await user.click(screen.getByRole('button', { name: /新しいプロンプトを追加/ }));
    fireEvent.change(screen.getByPlaceholderText('プロンプト本文...'), { target: { value: 'テスト' } });
    fireEvent.change(screen.getByPlaceholderText('タグ（カンマ区切り）'), { target: { value: 'react, typescript' } });
    await user.click(screen.getByRole('button', { name: /^追加$/ }));
    expect(screen.getByText('react')).toBeInTheDocument();
    expect(screen.getByText('typescript')).toBeInTheDocument();
  });

  it('タグでフィルターできる（タグなしは非表示）', async () => {
    const { user } = setup();
    // タグあり
    await user.click(screen.getByRole('button', { name: /新しいプロンプトを追加/ }));
    fireEvent.change(screen.getByPlaceholderText('プロンプト本文...'), { target: { value: 'タグあり' } });
    fireEvent.change(screen.getByPlaceholderText('タグ（カンマ区切り）'), { target: { value: 'frontend' } });
    await user.click(screen.getByRole('button', { name: /^追加$/ }));
    // タグなし
    await addPrompt(user, 'タグなし');
    // #frontend フィルターをクリック
    await user.click(screen.getByRole('button', { name: '#frontend' }));
    expect(screen.getByText('タグあり')).toBeInTheDocument();
    expect(screen.queryByText('タグなし')).not.toBeInTheDocument();
  });

  it('タグフィルターをもう一度クリックすると解除される', async () => {
    const { user } = setup();
    await user.click(screen.getByRole('button', { name: /新しいプロンプトを追加/ }));
    fireEvent.change(screen.getByPlaceholderText('プロンプト本文...'), { target: { value: 'タグあり' } });
    fireEvent.change(screen.getByPlaceholderText('タグ（カンマ区切り）'), { target: { value: 'work' } });
    await user.click(screen.getByRole('button', { name: /^追加$/ }));
    await addPrompt(user, 'タグなし');
    await user.click(screen.getByRole('button', { name: '#work' }));
    await user.click(screen.getByRole('button', { name: '#work' }));
    expect(screen.getByText('タグなし')).toBeInTheDocument();
    expect(screen.getByText('タグあり')).toBeInTheDocument();
  });

  it('編集フォームにもタグ入力欄が表示され保存できる', async () => {
    const { user } = setup();
    await addPrompt(user, 'タグ編集テスト');
    await user.click(screen.getByRole('button', { name: '編集' }));
    const tagInput = screen.getByDisplayValue('');  // editTags は初期値 ''
    // placeholder でも取れる
    const tagInputByPlaceholder = screen.getByPlaceholderText('タグ（カンマ区切り）');
    fireEvent.change(tagInputByPlaceholder, { target: { value: 'edited-tag' } });
    await user.click(screen.getByRole('button', { name: /保存/ }));
    expect(screen.getByText('edited-tag')).toBeInTheDocument();
    expect(tagInput).toBeDefined(); // suppress unused warning
  });
});

// =====================
// プログレスマーカー
// =====================
describe('プログレスマーカー', () => {
  it('「作業中にする」ボタンが各バブルに表示される', async () => {
    const { user } = setup();
    await addPrompt(user, 'テスト');
    expect(screen.getByRole('button', { name: '作業中にする' })).toBeInTheDocument();
  });

  it('「作業中にする」でバブルに in-progress クラスが付く', async () => {
    const { user } = setup();
    await addPrompt(user, '作業中テスト');
    await user.click(screen.getByRole('button', { name: '作業中にする' }));
    expect(screen.getByText('作業中テスト').closest('.os-bubble')).toHaveClass('in-progress');
  });

  it('「作業中を解除」でクラスが外れる', async () => {
    const { user } = setup();
    await addPrompt(user, '解除テスト');
    await user.click(screen.getByRole('button', { name: '作業中にする' }));
    await user.click(screen.getByRole('button', { name: '作業中を解除' }));
    expect(screen.getByText('解除テスト').closest('.os-bubble')).not.toHaveClass('in-progress');
  });

  it('別のプロンプトを作業中にすると前のが自動解除される', async () => {
    const { user } = setup();
    await addPrompt(user, 'A');
    await addPrompt(user, 'B'); // B が先頭
    await user.click(screen.getAllByRole('button', { name: '作業中にする' })[0]); // B を作業中
    await user.click(screen.getByRole('button', { name: '作業中にする' })); // A を作業中（Bは解除されてボタンが1つになる）
    expect(screen.getByText('B').closest('.os-bubble')).not.toHaveClass('in-progress');
    expect(screen.getByText('A').closest('.os-bubble')).toHaveClass('in-progress');
  });
});

// =====================
// 並べ替え
// =====================
describe('並べ替え', () => {
  it('フィルターなし時に上・下移動ボタンが表示される', async () => {
    const { user } = setup();
    await addPrompt(user, 'テスト');
    expect(screen.getByRole('button', { name: '上に移動' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '下に移動' })).toBeInTheDocument();
  });

  it('プロンプトが1件のとき上・下ボタンは両方無効', async () => {
    const { user } = setup();
    await addPrompt(user, '一件だけ');
    expect(screen.getByRole('button', { name: '上に移動' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '下に移動' })).toBeDisabled();
  });

  it('先頭プロンプトの上ボタンは無効、下ボタンは有効', async () => {
    const { user } = setup();
    await addPrompt(user, 'A');
    await addPrompt(user, 'B'); // B が先頭
    const upBtns = screen.getAllByRole('button', { name: '上に移動' });
    const downBtns = screen.getAllByRole('button', { name: '下に移動' });
    expect(upBtns[0]).toBeDisabled();   // B は上に行けない
    expect(downBtns[0]).toBeEnabled();  // B は下に行ける
    expect(upBtns[1]).toBeEnabled();    // A は上に行ける
    expect(downBtns[1]).toBeDisabled(); // A は下に行けない
  });

  it('下ボタンクリックで先頭が2番目に移動する', async () => {
    const { user, container } = setup();
    await addPrompt(user, '古いプロンプト');
    await addPrompt(user, '新しいプロンプト'); // 表示順: [新しい, 古い]
    const downBtns = screen.getAllByRole('button', { name: '下に移動' });
    await user.click(downBtns[0]); // 「新しいプロンプト」を下へ
    const bodies = container.querySelectorAll('.os-bubble-body');
    expect(bodies[0].textContent).toContain('古いプロンプト');
    expect(bodies[1].textContent).toContain('新しいプロンプト');
  });

  it('上ボタンクリックで2番目が先頭に移動する', async () => {
    const { user, container } = setup();
    await addPrompt(user, '古いプロンプト');
    await addPrompt(user, '新しいプロンプト'); // 表示順: [新しい, 古い]
    const upBtns = screen.getAllByRole('button', { name: '上に移動' });
    await user.click(upBtns[1]); // 「古いプロンプト」を上へ
    const bodies = container.querySelectorAll('.os-bubble-body');
    expect(bodies[0].textContent).toContain('古いプロンプト');
    expect(bodies[1].textContent).toContain('新しいプロンプト');
  });

  it('フィルター中は並べ替えボタンが非表示', async () => {
    const { user } = setup();
    await addPrompt(user, 'テスト');
    await user.click(screen.getByRole('button', { name: /^未送信$/ }));
    expect(screen.queryByRole('button', { name: '上に移動' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '下に移動' })).not.toBeInTheDocument();
  });
});

// =====================
// フィルター永続化
// =====================
describe('フィルター永続化', () => {
  it('フィルターを変更すると localStorage に保存される', async () => {
    const { user } = setup();
    await addPrompt(user, 'テスト');
    await user.click(screen.getByRole('button', { name: /^未送信$/ }));
    const stored = JSON.parse(localStorage.getItem('oneshot-filter') ?? '{}');
    expect(stored.filterMode).toBe('unsent');
  });

  it('localStorage にフィルター状態があれば起動時に復元される', () => {
    localStorage.setItem('oneshot-filter', JSON.stringify({ filterMode: 'sent', selectedTag: null }));
    localStorage.setItem('oneshot-prompts', JSON.stringify([
      { id: 'a', body: 'sent-prompt', replies: [], sent: true, createdAt: 1, updatedAt: 1, tags: [] },
      { id: 'b', body: 'unsent-prompt', replies: [], sent: false, createdAt: 2, updatedAt: 2, tags: [] },
    ]));
    setup();
    expect(screen.getByText('sent-prompt')).toBeInTheDocument();
    expect(screen.queryByText('unsent-prompt')).not.toBeInTheDocument();
  });
});

// =====================
// 折りたたみ
// =====================
describe('折りたたみ', () => {
  it('各プロンプトに折りたたみボタンが表示される', async () => {
    const { user } = setup();
    await addPrompt(user, 'テスト');
    expect(screen.getByRole('button', { name: '折りたたむ' })).toBeInTheDocument();
  });

  it('折りたたみボタンをクリックすると本文が非表示になる', async () => {
    const { user } = setup();
    await addPrompt(user, '折りたたみテスト本文');
    await user.click(screen.getByRole('button', { name: '折りたたむ' }));
    expect(screen.queryByText('折りたたみテスト本文')).not.toBeInTheDocument();
  });

  it('折りたたみ後に展開ボタンをクリックすると本文が表示される', async () => {
    const { user } = setup();
    await addPrompt(user, '折りたたみテスト本文');
    await user.click(screen.getByRole('button', { name: '折りたたむ' }));
    await user.click(screen.getByRole('button', { name: '展開する' }));
    expect(screen.getByText('折りたたみテスト本文')).toBeInTheDocument();
  });

  it('全折りたたみボタンで全プロンプトが折りたたまれる', async () => {
    const { user } = setup();
    await addPrompt(user, 'プロンプトA');
    await addPrompt(user, 'プロンプトB');
    await user.click(screen.getByRole('button', { name: '全折りたたみ' }));
    expect(screen.queryByText('プロンプトA')).not.toBeInTheDocument();
    expect(screen.queryByText('プロンプトB')).not.toBeInTheDocument();
  });

  it('全展開ボタンで全プロンプトが展開される', async () => {
    const { user } = setup();
    await addPrompt(user, 'プロンプトA');
    await addPrompt(user, 'プロンプトB');
    await user.click(screen.getByRole('button', { name: '全折りたたみ' }));
    await user.click(screen.getByRole('button', { name: '全展開' }));
    expect(screen.getByText('プロンプトA')).toBeInTheDocument();
    expect(screen.getByText('プロンプトB')).toBeInTheDocument();
  });
});

// =====================
// 解決済みマーク
// =====================
describe('解決済みマーク', () => {
  it('各プロンプトに「解決済みにする」ボタンが表示される', async () => {
    const { user } = setup();
    await addPrompt(user, 'テスト');
    expect(screen.getByRole('button', { name: '解決済みにする' })).toBeInTheDocument();
  });

  it('「解決済みにする」をクリックするとバブルに resolved クラスが付く', async () => {
    const { user } = setup();
    await addPrompt(user, '解決テスト');
    await user.click(screen.getByRole('button', { name: '解決済みにする' }));
    expect(document.querySelector('.os-bubble.resolved')).toBeInTheDocument();
  });

  it('「解決済みにする」をクリックすると自動で折りたたまれる', async () => {
    const { user } = setup();
    await addPrompt(user, '解決テスト本文');
    await user.click(screen.getByRole('button', { name: '解決済みにする' }));
    expect(screen.queryByText('解決テスト本文')).not.toBeInTheDocument();
  });

  it('「解決済みを解除」をクリックするとクラスが外れて展開される', async () => {
    const { user } = setup();
    await addPrompt(user, '解除テスト');
    await user.click(screen.getByRole('button', { name: '解決済みにする' }));
    await user.click(screen.getByRole('button', { name: '解決済みを解除' }));
    expect(document.querySelector('.os-bubble.resolved')).not.toBeInTheDocument();
    expect(screen.getByText('解除テスト')).toBeInTheDocument();
  });

  it('解決済み状態が localStorage に保存される', async () => {
    const { user } = setup();
    await addPrompt(user, '保存テスト');
    await user.click(screen.getByRole('button', { name: '解決済みにする' }));
    const stored = JSON.parse(localStorage.getItem('oneshot-prompts') ?? '[]');
    expect(stored[0].resolved).toBe(true);
  });
});

// =====================
// キーボードショートカット（Cmd+Enter）
// =====================
describe('キーボードショートカット（Cmd+Enter）', () => {
  it('新規フォームで Cmd+Enter を押すとプロンプトが追加される', async () => {
    const { user } = setup();
    await user.click(screen.getByRole('button', { name: /新しいプロンプトを追加/ }));
    const textarea = screen.getByPlaceholderText('プロンプト本文...');
    fireEvent.change(textarea, { target: { value: 'Cmd+Enterで追加' } });
    fireEvent.keyDown(textarea, { key: 'Enter', metaKey: true });
    expect(screen.getByText('Cmd+Enterで追加')).toBeInTheDocument();
  });

  it('編集フォームで Cmd+Enter を押すと保存される', async () => {
    const { user } = setup();
    await addPrompt(user, '元テキスト');
    await user.click(screen.getByRole('button', { name: '編集' }));
    const textarea = screen.getByDisplayValue('元テキスト');
    fireEvent.change(textarea, { target: { value: '更新テキスト' } });
    fireEvent.keyDown(textarea, { key: 'Enter', metaKey: true });
    expect(screen.getByText('更新テキスト')).toBeInTheDocument();
  });
});

// =====================
// プログレスマーカー スピナー
// =====================
describe('プログレスマーカー スピナー', () => {
  it('作業中にするとボタンに spinning クラスが付く', async () => {
    const { user } = setup();
    await addPrompt(user, 'テスト');
    await user.click(screen.getByRole('button', { name: '作業中にする' }));
    expect(screen.getByRole('button', { name: '作業中を解除' })).toHaveClass('spinning');
  });

  it('作業中を解除すると spinning クラスが外れる', async () => {
    const { user } = setup();
    await addPrompt(user, 'テスト');
    await user.click(screen.getByRole('button', { name: '作業中にする' }));
    await user.click(screen.getByRole('button', { name: '作業中を解除' }));
    expect(screen.getByRole('button', { name: '作業中にする' })).not.toHaveClass('spinning');
  });
});