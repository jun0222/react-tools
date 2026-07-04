import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '../../context/ThemeContext';
import { MetaProvider } from '../../context/MetaContext';
import Unpack from './Unpack';

const renderUnpack = () =>
  render(
    <MemoryRouter>
      <MetaProvider>
        <ThemeProvider>
          <Unpack />
        </ThemeProvider>
      </MetaProvider>
    </MemoryRouter>,
  );

describe('Unpack', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('単語未入力のときコピーボタンが無効になる', () => {
    renderUnpack();
    expect(screen.getByRole('button', { name: 'プロンプトをコピー' })).toBeDisabled();
  });

  it('単語を入力するとコピーボタンが有効になる', () => {
    renderUnpack();
    fireEvent.change(screen.getByPlaceholderText(/単語・概念/), { target: { value: '再帰' } });
    expect(screen.getByRole('button', { name: 'プロンプトをコピー' })).not.toBeDisabled();
  });

  it('入力した単語がプレビューに含まれる', () => {
    renderUnpack();
    fireEvent.change(screen.getByPlaceholderText(/単語・概念/), { target: { value: 'ポインタ' } });
    const preview = screen.getByRole('region', { name: 'プロンプトプレビュー' });
    expect(preview.textContent).toContain('ポインタ');
  });

  it('単語をlocalStorageに保存する', () => {
    renderUnpack();
    fireEvent.change(screen.getByPlaceholderText(/単語・概念/), { target: { value: 'クロージャ' } });
    expect(localStorage.getItem('unpack-word')).toBe(JSON.stringify('クロージャ'));
  });

  it('ページ再読み込みで前回の入力が復元される', () => {
    localStorage.setItem('unpack-word', JSON.stringify('カリー化'));
    renderUnpack();
    expect((screen.getByPlaceholderText(/単語・概念/) as HTMLInputElement).value).toBe('カリー化');
  });

  it('コピーボタンを押すとクリップボードにプロンプトが書き込まれる', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText } });

    renderUnpack();
    fireEvent.change(screen.getByPlaceholderText(/単語・概念/), { target: { value: 'メモ化' } });
    fireEvent.click(screen.getByRole('button', { name: 'プロンプトをコピー' }));

    await vi.waitFor(() => {
      expect(writeText).toHaveBeenCalledOnce();
      expect(writeText.mock.calls[0][0]).toContain('メモ化');
    });
  });
});
