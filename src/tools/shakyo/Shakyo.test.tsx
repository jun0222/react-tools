import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '../../context/ThemeContext';
import { MetaProvider } from '../../context/MetaContext';
import Shakyo from './Shakyo';

const renderShakyo = () =>
  render(
    <MemoryRouter>
      <MetaProvider>
        <ThemeProvider>
          <Shakyo />
        </ThemeProvider>
      </MetaProvider>
    </MemoryRouter>,
  );

describe('Shakyo', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('文章はtextareaタグに入力する', () => {
    renderShakyo();
    expect(screen.getByPlaceholderText(/文章/).tagName).toBe('TEXTAREA');
  });

  it('未入力のときコピーボタンが無効になる', () => {
    renderShakyo();
    expect(screen.getByRole('button', { name: 'プロンプトをコピー' })).toBeDisabled();
  });

  it('文章を入力するとコピーボタンが有効になりプレビューに反映される', () => {
    renderShakyo();
    fireEvent.change(screen.getByPlaceholderText(/文章/), { target: { value: 'これはテスト文章です。' } });
    expect(screen.getByRole('button', { name: 'プロンプトをコピー' })).not.toBeDisabled();
    const preview = screen.getByRole('region', { name: 'プロンプトプレビュー' });
    expect(preview.textContent).toContain('これはテスト文章です。');
    expect(preview.textContent).toContain('写経');
  });

  it('文章をlocalStorageに保存する', () => {
    renderShakyo();
    fireEvent.change(screen.getByPlaceholderText(/文章/), { target: { value: '保存されるべき文章' } });
    expect(localStorage.getItem('shakyo-text')).toBe(JSON.stringify('保存されるべき文章'));
  });

  it('ページ再読み込みで前回の入力が復元される', () => {
    localStorage.setItem('shakyo-text', JSON.stringify('前回の文章'));
    renderShakyo();
    expect(screen.getByPlaceholderText(/文章/)).toHaveValue('前回の文章');
  });

  it('コピーボタンを押すとクリップボードにプロンプトが書き込まれる', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText } });

    renderShakyo();
    fireEvent.change(screen.getByPlaceholderText(/文章/), { target: { value: 'コピー対象の文章' } });
    fireEvent.click(screen.getByRole('button', { name: 'プロンプトをコピー' }));

    await vi.waitFor(() => {
      expect(writeText).toHaveBeenCalledOnce();
      expect(writeText.mock.calls[0][0]).toContain('コピー対象の文章');
    });
  });
});
