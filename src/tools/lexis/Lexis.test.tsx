import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '../../context/ThemeContext';
import { MetaProvider } from '../../context/MetaContext';
import Lexis from './Lexis';

const renderLexis = () =>
  render(
    <MemoryRouter>
      <MetaProvider>
        <ThemeProvider>
          <Lexis />
        </ThemeProvider>
      </MetaProvider>
    </MemoryRouter>,
  );

describe('Lexis', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('単語未入力のときコピーボタンが無効になる', () => {
    renderLexis();
    expect(screen.getByRole('button', { name: 'プロンプトをコピー' })).toBeDisabled();
  });

  it('単語を入力するとコピーボタンが有効になる', () => {
    renderLexis();
    fireEvent.change(screen.getByPlaceholderText('単語・概念を入力...'), {
      target: { value: 'メタファー' },
    });
    expect(screen.getByRole('button', { name: 'プロンプトをコピー' })).not.toBeDisabled();
  });

  it('生成プロンプトに定義・語源・なぜ・例文・歴史的経緯の各項目が含まれる', () => {
    renderLexis();
    fireEvent.change(screen.getByPlaceholderText('単語・概念を入力...'), {
      target: { value: 'アルゴリズム' },
    });
    const preview = screen.getByRole('region', { name: 'プロンプトプレビュー' });
    expect(preview.textContent).toContain('定義');
    expect(preview.textContent).toContain('語源');
    expect(preview.textContent).toContain('なぜ');
    expect(preview.textContent).toContain('例文');
    expect(preview.textContent).toContain('歴史的経緯');
  });

  it('入力した単語がプロンプトに含まれる', () => {
    renderLexis();
    fireEvent.change(screen.getByPlaceholderText('単語・概念を入力...'), {
      target: { value: 'パラダイム' },
    });
    const preview = screen.getByRole('region', { name: 'プロンプトプレビュー' });
    expect(preview.textContent).toContain('パラダイム');
  });

  it('単語をlocalStorageに保存する', () => {
    renderLexis();
    fireEvent.change(screen.getByPlaceholderText('単語・概念を入力...'), {
      target: { value: 'エントロピー' },
    });
    expect(localStorage.getItem('lexis-word')).toBe(JSON.stringify('エントロピー'));
  });

  it('ページ再読み込みで前回の単語が復元される', () => {
    localStorage.setItem('lexis-word', JSON.stringify('フラクタル'));
    renderLexis();
    expect(
      (screen.getByPlaceholderText('単語・概念を入力...') as HTMLInputElement).value,
    ).toBe('フラクタル');
  });

  it('Englishモードに切り替えると英語プロンプトが生成される', () => {
    renderLexis();
    fireEvent.change(screen.getByPlaceholderText('単語・概念を入力...'), {
      target: { value: 'entropy' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'English' }));
    const preview = screen.getByRole('region', { name: 'プロンプトプレビュー' });
    expect(preview.textContent).toContain('Definition');
    expect(preview.textContent).toContain('Etymology');
  });

  it('コピーボタンを押すとクリップボードに単語を含むプロンプトが書き込まれる', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText } });

    renderLexis();
    fireEvent.change(screen.getByPlaceholderText('単語・概念を入力...'), {
      target: { value: 'レジリエンス' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'プロンプトをコピー' }));

    await vi.waitFor(() => {
      expect(writeText).toHaveBeenCalledOnce();
      expect(writeText.mock.calls[0][0]).toContain('レジリエンス');
    });
  });
});