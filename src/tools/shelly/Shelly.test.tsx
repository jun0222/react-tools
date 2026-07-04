import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '../../context/ThemeContext';
import { MetaProvider } from '../../context/MetaContext';
import Shelly from './Shelly';

const renderShelly = () =>
  render(
    <MemoryRouter>
      <MetaProvider>
        <ThemeProvider>
          <Shelly />
        </ThemeProvider>
      </MetaProvider>
    </MemoryRouter>,
  );

describe('Shelly', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('ヒント未入力でもコピーボタンが有効になる', () => {
    renderShelly();
    expect(screen.getByRole('button', { name: 'プロンプトをコピー' })).not.toBeDisabled();
  });

  it('未入力時のプレビューにPOSIXと質問は1つだけのルールが含まれる', () => {
    renderShelly();
    const preview = screen.getByRole('region', { name: 'プロンプトプレビュー' });
    expect(preview.textContent).toContain('POSIX');
    expect(preview.textContent).toContain('質問は1つだけ');
  });

  it('ヒントを入力するとプレビューに反映される', () => {
    renderShelly();
    fireEvent.change(screen.getByPlaceholderText(/ヒント/), { target: { value: 'ログの一括削除' } });
    const preview = screen.getByRole('region', { name: 'プロンプトプレビュー' });
    expect(preview.textContent).toContain('ログの一括削除');
  });

  it('コピーボタンを押すとクリップボードにプロンプトが書き込まれる', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText } });

    renderShelly();
    fireEvent.click(screen.getByRole('button', { name: 'プロンプトをコピー' }));

    await vi.waitFor(() => {
      expect(writeText).toHaveBeenCalledOnce();
      expect(writeText.mock.calls[0][0]).toContain('ドライラン');
    });
  });
});