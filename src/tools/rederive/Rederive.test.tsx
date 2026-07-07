import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '../../context/ThemeContext';
import { MetaProvider } from '../../context/MetaContext';
import Rederive from './Rederive';

const renderRederive = () =>
  render(
    <MemoryRouter>
      <MetaProvider>
        <ThemeProvider>
          <Rederive />
        </ThemeProvider>
      </MetaProvider>
    </MemoryRouter>,
  );

describe('Rederive', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('未入力のときコピーボタンが無効になる', () => {
    renderRederive();
    expect(screen.getByRole('button', { name: 'プロンプトをコピー' })).toBeDisabled();
  });

  it('概念を入力するとプレビューに反映される', () => {
    renderRederive();
    fireEvent.change(screen.getByPlaceholderText(/概念/), { target: { value: '再帰' } });
    const preview = screen.getByRole('region', { name: 'プロンプトプレビュー' });
    expect(preview.textContent).toContain('問題意識');
    expect(preview.textContent).toContain('再帰');
  });

  it('コピーボタンを押すとクリップボードに書き込まれる', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText } });

    renderRederive();
    fireEvent.change(screen.getByPlaceholderText(/概念/), { target: { value: 'モナド' } });
    fireEvent.click(screen.getByRole('button', { name: 'プロンプトをコピー' }));

    await vi.waitFor(() => {
      expect(writeText).toHaveBeenCalledOnce();
      expect(writeText.mock.calls[0][0]).toContain('モナド');
    });
  });
});
