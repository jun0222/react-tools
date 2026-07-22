import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '../../context/ThemeContext';
import { MetaProvider } from '../../context/MetaContext';
import Githubhub from './Githubhub';

const renderTool = () =>
  render(
    <MemoryRouter>
      <MetaProvider>
        <ThemeProvider>
          <Githubhub />
        </ThemeProvider>
      </MetaProvider>
    </MemoryRouter>,
  );

describe('Githubhub', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('7つのステータス列がパイプライン順で表示される', () => {
    renderTool();
    const headers = screen.getAllByTestId('gh-column-header').map(el => el.textContent);
    expect(headers).toEqual([
      'Draft0', 'Open0', '1次レビューまち0', '1次修正中0',
      '2次レビューまち0', '2次修正中0', 'Merged0',
    ]);
  });

  it('入力なしのときコピーボタンが無効になる', () => {
    renderTool();
    expect(screen.getByRole('button', { name: 'サマリをコピー' })).toBeDisabled();
  });

  it('PRを入力するとステータス列にカードが表示される', () => {
    renderTool();
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: '・https://github.com/org/repo/pull/123 open ログイン修正' },
    });
    expect(screen.getByText('#123 ログイン修正')).toBeInTheDocument();
  });

  it('タイトルがない場合は番号のみ表示される', () => {
    renderTool();
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: '・https://github.com/org/repo/pull/9 merged' },
    });
    expect(screen.getByText('#9')).toBeInTheDocument();
  });

  it('カードをクリックするとPRのURLが新しいタブで開かれる', () => {
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
    renderTool();
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: '・https://github.com/org/repo/pull/123 open タイトル' },
    });
    fireEvent.click(screen.getByText('#123 タイトル'));
    expect(openSpy).toHaveBeenCalledWith(
      'https://github.com/org/repo/pull/123',
      '_blank',
      'noopener,noreferrer',
    );
  });

  it('依存先が入力内に存在する場合、依存バッジがリンクになる', () => {
    renderTool();
    fireEvent.change(screen.getByRole('textbox'), {
      target: {
        value:
          '・https://github.com/org/repo/pull/120 open 先行PR\n・https://github.com/org/repo/pull/123 open 後続PR {依存:#120}',
      },
    });
    const badge = screen.getByText('→ #120');
    expect(badge.tagName).toBe('A');
    expect(badge).toHaveAttribute('href', 'https://github.com/org/repo/pull/120');
  });

  it('依存先が入力内に存在しない場合、依存バッジはリンクにならない', () => {
    renderTool();
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: '・https://github.com/org/repo/pull/123 open タイトル {依存:#999}' },
    });
    const badge = screen.getByText('→ #999');
    expect(badge.tagName).not.toBe('A');
  });

  it('カードにリポジトリ名のバッジが表示される', () => {
    renderTool();
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: '・https://github.com/acme/webapp/pull/123 open ログイン修正' },
    });
    expect(screen.getByText('webapp')).toBeInTheDocument();
  });

  it('異なるリポジトリには異なるバッジ色が付く', () => {
    renderTool();
    fireEvent.change(screen.getByRole('textbox'), {
      target: {
        value:
          '・https://github.com/acme/webapp/pull/1 open A\n・https://github.com/acme/api/pull/2 open B',
      },
    });
    const webappBadge = screen.getByText('webapp');
    const apiBadge = screen.getByText('api');
    expect(webappBadge.style.backgroundColor).not.toBe(apiBadge.style.backgroundColor);
  });

  it('{now}が付いていないときは作業中領域が表示されない', () => {
    renderTool();
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: '・https://github.com/org/repo/pull/1 open タイトル' },
    });
    expect(screen.queryByRole('region', { name: '作業中' })).not.toBeInTheDocument();
  });

  it('{now}が付いたPRは作業中領域と元のカンバン列の両方に表示される', () => {
    renderTool();
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: '・https://github.com/org/repo/pull/1 open 対応中タスク {now}' },
    });
    const nowArea = screen.getByRole('region', { name: '作業中' });
    expect(nowArea.textContent).toContain('対応中タスク');

    const board = screen.getByRole('region', { name: 'カンバンボード' });
    expect(board.textContent).toContain('対応中タスク');
  });

  it('作業中領域はカンバンボードより前（上）に表示される', () => {
    renderTool();
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: '・https://github.com/org/repo/pull/1 open タイトル {now}' },
    });
    const nowArea = screen.getByRole('region', { name: '作業中' });
    const board = screen.getByRole('region', { name: 'カンバンボード' });
    expect(nowArea.compareDocumentPosition(board) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('コピーしたサマリには【作業中】セクションを含めない', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText } });

    renderTool();
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: '・https://github.com/org/repo/pull/1 open タイトル {now}' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'サマリをコピー' }));

    await vi.waitFor(() => {
      const text: string = writeText.mock.calls[0][0];
      expect(text).not.toContain('【作業中】');
      expect(text).toContain('・#1 タイトル');
    });
  });

  it('コピーボタンを押すとクリップボードにサマリが書き込まれる', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText } });

    renderTool();
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: '・https://github.com/org/repo/pull/123 merged タイトル' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'サマリをコピー' }));

    await vi.waitFor(() => {
      expect(writeText).toHaveBeenCalledOnce();
      expect(writeText.mock.calls[0][0]).toContain('・#123 タイトル');
    });
  });

  it('入力をlocalStorageに保存し再読み込みで復元する', () => {
    renderTool();
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: '・https://github.com/org/repo/pull/1 open' },
    });
    expect(localStorage.getItem('githubhub-text')).toBe(
      JSON.stringify('・https://github.com/org/repo/pull/1 open'),
    );
  });

  it('初期状態ではマニュアルモーダルは表示されない', () => {
    renderTool();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('マニュアルボタンを押すとモーダルが表示され入力形式の説明が見える', () => {
    renderTool();
    fireEvent.click(screen.getByRole('button', { name: 'マニュアル' }));
    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(dialog.textContent).toContain('依存');
    expect(dialog.textContent).toContain('draft');
    expect(dialog.textContent).toContain('担当');
  });

  it('カードに{担当:名前}のアイコンが表示される', () => {
    renderTool();
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: '・https://github.com/org/repo/pull/123 open タイトル {担当:田中}' },
    });
    const avatar = screen.getByText('田');
    expect(avatar).toHaveClass('gh-avatar');
  });

  it('担当者が異なると異なる色のアイコンになる', () => {
    renderTool();
    fireEvent.change(screen.getByRole('textbox'), {
      target: {
        value:
          '・https://github.com/org/repo/pull/1 open A {担当:田中}\n・https://github.com/org/repo/pull/2 open B {担当:鈴木}',
      },
    });
    const tanaka = screen.getByText('田');
    const suzuki = screen.getByText('鈴');
    expect(tanaka.style.backgroundColor).not.toBe(suzuki.style.backgroundColor);
  });

  it('{担当:名前}がない場合はアイコンが表示されない', () => {
    renderTool();
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: '・https://github.com/org/repo/pull/1 open タイトル' },
    });
    expect(document.querySelector('.gh-avatar')).not.toBeInTheDocument();
  });

  it('閉じるボタンを押すとモーダルが閉じる', () => {
    renderTool();
    fireEvent.click(screen.getByRole('button', { name: 'マニュアル' }));
    fireEvent.click(screen.getByRole('button', { name: '閉じる' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('背景をクリックするとモーダルが閉じる', () => {
    renderTool();
    fireEvent.click(screen.getByRole('button', { name: 'マニュアル' }));
    fireEvent.click(screen.getByTestId('gh-modal-backdrop'));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
