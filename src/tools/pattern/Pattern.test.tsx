import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '../../context/ThemeContext';
import { MetaProvider } from '../../context/MetaContext';
import Pattern from './Pattern';

const renderPattern = () =>
  render(
    <MemoryRouter>
      <MetaProvider>
        <ThemeProvider>
          <Pattern />
        </ThemeProvider>
      </MetaProvider>
    </MemoryRouter>,
  );

describe('Pattern', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('パターン名未入力のときコピーボタンが無効になる', () => {
    renderPattern();
    expect(screen.getByRole('button', { name: 'プロンプトをコピー' })).toBeDisabled();
  });

  it('パターン名を入力するとコピーボタンが有効になる', () => {
    renderPattern();
    fireEvent.change(screen.getByPlaceholderText(/パターン|pattern/i), { target: { value: 'Singleton' } });
    expect(screen.getByRole('button', { name: 'プロンプトをコピー' })).not.toBeDisabled();
  });

  it('入力したパターン名がプレビューに含まれる', () => {
    renderPattern();
    fireEvent.change(screen.getByPlaceholderText(/パターン|pattern/i), { target: { value: 'Observer' } });
    const preview = screen.getByRole('region', { name: 'プロンプトプレビュー' });
    expect(preview.textContent).toContain('Observer');
  });

  it('パターン名をlocalStorageに保存する', () => {
    renderPattern();
    fireEvent.change(screen.getByPlaceholderText(/パターン|pattern/i), { target: { value: 'Strategy' } });
    expect(localStorage.getItem('pattern-word')).toBe(JSON.stringify('Strategy'));
  });

  it('ページ再読み込みで前回の入力が復元される', () => {
    localStorage.setItem('pattern-word', JSON.stringify('Factory'));
    renderPattern();
    expect((screen.getByPlaceholderText(/パターン|pattern/i) as HTMLInputElement).value).toBe('Factory');
  });

  it('コピーボタンを押すとクリップボードにプロンプトが書き込まれる', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText } });

    renderPattern();
    fireEvent.change(screen.getByPlaceholderText(/パターン|pattern/i), { target: { value: 'Decorator' } });
    fireEvent.click(screen.getByRole('button', { name: 'プロンプトをコピー' }));

    await vi.waitFor(() => {
      expect(writeText).toHaveBeenCalledOnce();
      expect(writeText.mock.calls[0][0]).toContain('Decorator');
    });
  });

  it('Englishモードで英語プロンプトが生成される', () => {
    renderPattern();
    fireEvent.change(screen.getByPlaceholderText(/パターン|pattern/i), { target: { value: 'Adapter' } });
    fireEvent.click(screen.getByRole('button', { name: 'English' }));
    const preview = screen.getByRole('region', { name: 'プロンプトプレビュー' });
    expect(preview.textContent).toContain('Overview');
  });
});