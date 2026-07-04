import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '../../context/ThemeContext';
import { MetaProvider } from '../../context/MetaContext';
import Blogen from './Blogen';

const renderBlogen = () =>
  render(
    <MemoryRouter>
      <MetaProvider>
        <ThemeProvider>
          <Blogen />
        </ThemeProvider>
      </MetaProvider>
    </MemoryRouter>,
  );

describe('Blogen', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('トピックはtextareaタグに入力する', () => {
    renderBlogen();
    expect(screen.getByPlaceholderText(/トピック/).tagName).toBe('TEXTAREA');
  });

  it('文字数のデフォルト値は30である', () => {
    renderBlogen();
    expect(screen.getByLabelText('文字数')).toHaveValue(30);
  });

  it('トピック未入力のときコピーボタンが無効になる', () => {
    renderBlogen();
    expect(screen.getByRole('button', { name: 'プロンプトをコピー' })).toBeDisabled();
  });

  it('トピックを入力するとコピーボタンが有効になりプレビューに反映される', () => {
    renderBlogen();
    fireEvent.change(screen.getByPlaceholderText(/トピック/), { target: { value: '猫' } });
    expect(screen.getByRole('button', { name: 'プロンプトをコピー' })).not.toBeDisabled();
    const preview = screen.getByRole('region', { name: 'プロンプトプレビュー' });
    expect(preview.textContent).toBe('「猫」について30文字でブログを書いて。');
  });

  it('文字数を変更するとプレビューに反映される', () => {
    renderBlogen();
    fireEvent.change(screen.getByPlaceholderText(/トピック/), { target: { value: '猫' } });
    fireEvent.change(screen.getByLabelText('文字数'), { target: { value: '500' } });
    const preview = screen.getByRole('region', { name: 'プロンプトプレビュー' });
    expect(preview.textContent).toBe('「猫」について500文字でブログを書いて。');
  });

  it('トピックと文字数をlocalStorageに保存する', () => {
    renderBlogen();
    fireEvent.change(screen.getByPlaceholderText(/トピック/), { target: { value: '犬' } });
    fireEvent.change(screen.getByLabelText('文字数'), { target: { value: '100' } });
    expect(localStorage.getItem('blogen-word')).toBe(JSON.stringify('犬'));
    expect(localStorage.getItem('blogen-n')).toBe(JSON.stringify(100));
  });

  it('ページ再読み込みで前回の入力が復元される', () => {
    localStorage.setItem('blogen-word', JSON.stringify('鳥'));
    localStorage.setItem('blogen-n', JSON.stringify(200));
    renderBlogen();
    expect(screen.getByPlaceholderText(/トピック/)).toHaveValue('鳥');
    expect(screen.getByLabelText('文字数')).toHaveValue(200);
  });

  it('コピーボタンを押すとクリップボードにプロンプトが書き込まれる', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText } });

    renderBlogen();
    fireEvent.change(screen.getByPlaceholderText(/トピック/), { target: { value: '旅行' } });
    fireEvent.click(screen.getByRole('button', { name: 'プロンプトをコピー' }));

    await vi.waitFor(() => {
      expect(writeText).toHaveBeenCalledOnce();
      expect(writeText.mock.calls[0][0]).toBe('「旅行」について30文字でブログを書いて。');
    });
  });
});