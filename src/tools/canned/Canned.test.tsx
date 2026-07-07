import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '../../context/ThemeContext';
import { MetaProvider } from '../../context/MetaContext';
import Canned from './Canned';

const renderCanned = () =>
  render(
    <MemoryRouter>
      <MetaProvider>
        <ThemeProvider>
          <Canned />
        </ThemeProvider>
      </MetaProvider>
    </MemoryRouter>,
  );

describe('Canned', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('プルダウンにgrill-meが選択肢として含まれる', () => {
    renderCanned();
    expect(screen.getByRole('option', { name: 'grill-me' })).toBeInTheDocument();
  });

  it('初期表示でgrill-meの本文がプレビューされる', () => {
    renderCanned();
    const preview = screen.getByRole('region', { name: 'プロンプトプレビュー' });
    expect(preview.textContent).toContain('質問は一度に一つずつ');
  });

  it('未選択時ではなく常にコピーボタンが有効になる', () => {
    renderCanned();
    expect(screen.getByRole('button', { name: 'プロンプトをコピー' })).not.toBeDisabled();
  });

  it('コピーボタンを押すとクリップボードにテンプレート本文が書き込まれる', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText } });

    renderCanned();
    fireEvent.click(screen.getByRole('button', { name: 'プロンプトをコピー' }));

    await vi.waitFor(() => {
      expect(writeText).toHaveBeenCalledOnce();
      expect(writeText.mock.calls[0][0]).toContain('質問は一度に一つずつ');
    });
  });
});
