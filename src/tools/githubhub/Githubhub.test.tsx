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

  it('4つのステータス列がdraft→open→review→mergedの順で表示される', () => {
    renderTool();
    const headers = screen.getAllByTestId('gh-column-header').map(el => el.textContent);
    expect(headers).toEqual(['Draft0', 'Open0', 'Review中0', 'Merged0']);
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
