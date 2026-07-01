import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '../../context/ThemeContext';
import { MetaProvider } from '../../context/MetaContext';
import Grok from './Grok';

const renderGrok = () =>
  render(
    <MemoryRouter>
      <MetaProvider>
        <ThemeProvider>
          <Grok />
        </ThemeProvider>
      </MetaProvider>
    </MemoryRouter>,
  );

describe('Grok', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('概念未入力のときコピーボタンが無効になる', () => {
    renderGrok();
    expect(screen.getByRole('button', { name: 'プロンプトをコピー' })).toBeDisabled();
  });

  it('概念を入力するとコピーボタンが有効になる', () => {
    renderGrok();
    fireEvent.change(screen.getByPlaceholderText(/概念|concept/i), { target: { value: '再帰' } });
    expect(screen.getByRole('button', { name: 'プロンプトをコピー' })).not.toBeDisabled();
  });

  it('入力した概念がプレビューに含まれる', () => {
    renderGrok();
    fireEvent.change(screen.getByPlaceholderText(/概念|concept/i), { target: { value: 'ポインタ' } });
    const preview = screen.getByRole('region', { name: 'プロンプトプレビュー' });
    expect(preview.textContent).toContain('ポインタ');
  });

  it('概念をlocalStorageに保存する', () => {
    renderGrok();
    fireEvent.change(screen.getByPlaceholderText(/概念|concept/i), { target: { value: 'クロージャ' } });
    expect(localStorage.getItem('grok-word')).toBe(JSON.stringify('クロージャ'));
  });

  it('ページ再読み込みで前回の入力が復元される', () => {
    localStorage.setItem('grok-word', JSON.stringify('カリー化'));
    renderGrok();
    expect((screen.getByPlaceholderText(/概念|concept/i) as HTMLInputElement).value).toBe('カリー化');
  });

  it('コピーボタンを押すとクリップボードにプロンプトが書き込まれる', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText } });

    renderGrok();
    fireEvent.change(screen.getByPlaceholderText(/概念|concept/i), { target: { value: 'メモ化' } });
    fireEvent.click(screen.getByRole('button', { name: 'プロンプトをコピー' }));

    await vi.waitFor(() => {
      expect(writeText).toHaveBeenCalledOnce();
      expect(writeText.mock.calls[0][0]).toContain('メモ化');
    });
  });

  it('Englishモードで英語プロンプトが生成される', () => {
    renderGrok();
    fireEvent.change(screen.getByPlaceholderText(/概念|concept/i), { target: { value: 'memoization' } });
    fireEvent.click(screen.getByRole('button', { name: 'English' }));
    const preview = screen.getByRole('region', { name: 'プロンプトプレビュー' });
    expect(preview.textContent).toContain('Mechanism');
  });
});