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

  it('対象領域はtextareaタグに入力する', () => {
    renderShakyo();
    expect(screen.getByPlaceholderText(/対象領域/).tagName).toBe('TEXTAREA');
  });

  it('未入力のときコピーボタンが無効になる', () => {
    renderShakyo();
    expect(screen.getByRole('button', { name: 'プロンプトをコピー' })).toBeDisabled();
  });

  it('対象領域を入力するとコピーボタンが有効になりプレビューに反映される', () => {
    renderShakyo();
    fireEvent.change(screen.getByPlaceholderText(/対象領域/), { target: { value: 'モバイルアプリ開発' } });
    expect(screen.getByRole('button', { name: 'プロンプトをコピー' })).not.toBeDisabled();
    const preview = screen.getByRole('region', { name: 'プロンプトプレビュー' });
    expect(preview.textContent).toContain('モバイルアプリ開発において');
    expect(preview.textContent).toContain('写経');
  });

  it('対象領域をlocalStorageに保存する', () => {
    renderShakyo();
    fireEvent.change(screen.getByPlaceholderText(/対象領域/), { target: { value: '組込み開発' } });
    expect(localStorage.getItem('shakyo-text')).toBe(JSON.stringify('組込み開発'));
  });

  it('ページ再読み込みで前回の入力が復元される', () => {
    localStorage.setItem('shakyo-text', JSON.stringify('前回の対象領域'));
    renderShakyo();
    expect(screen.getByPlaceholderText(/対象領域/)).toHaveValue('前回の対象領域');
  });

  it('コピーボタンを押すとクリップボードにプロンプトが書き込まれる', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText } });

    renderShakyo();
    fireEvent.change(screen.getByPlaceholderText(/対象領域/), { target: { value: 'Web開発' } });
    fireEvent.click(screen.getByRole('button', { name: 'プロンプトをコピー' }));

    await vi.waitFor(() => {
      expect(writeText).toHaveBeenCalledOnce();
      expect(writeText.mock.calls[0][0]).toContain('Web開発において');
    });
  });
});