import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '../../context/ThemeContext';
import { MetaProvider } from '../../context/MetaContext';
import Echoboard from './Echoboard';

const renderTool = () =>
  render(
    <MemoryRouter>
      <MetaProvider>
        <ThemeProvider>
          <Echoboard />
        </ThemeProvider>
      </MetaProvider>
    </MemoryRouter>,
  );

describe('Echoboard', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('未入力時はプレースホルダーがDOMに表示される', () => {
    renderTool();
    const display = screen.getByRole('region', { name: '読み上げ用テキスト' });
    expect(display.textContent).toContain('ここにテキストが表示されます');
  });

  it('テキストを貼り付けるとDOM表示エリアに反映される', () => {
    renderTool();
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'こんにちは、世界' } });
    const display = screen.getByRole('region', { name: '読み上げ用テキスト' });
    expect(display.textContent).toContain('こんにちは、世界');
  });

  it('HTMLタグを含むテキストはエスケープされ、literalなテキストとして表示される（XSS対策）', () => {
    renderTool();
    const malicious = '<script>window.__xss = true;</script>';
    fireEvent.change(screen.getByRole('textbox'), { target: { value: malicious } });

    const display = screen.getByRole('region', { name: '読み上げ用テキスト' });
    // テキストとしてそのまま表示される（HTMLとして解釈されない）
    expect(display.textContent).toContain(malicious);
    // scriptタグとしてDOMに実体化していないこと
    expect(display.querySelector('script')).toBeNull();
    expect((window as unknown as { __xss?: boolean }).__xss).toBeUndefined();
  });

  it('imgタグのonerror等も実行されずliteralに表示される', () => {
    renderTool();
    const malicious = '<img src=x onerror="window.__xss2=true">';
    fireEvent.change(screen.getByRole('textbox'), { target: { value: malicious } });

    const display = screen.getByRole('region', { name: '読み上げ用テキスト' });
    expect(display.textContent).toContain(malicious);
    expect(display.querySelector('img')).toBeNull();
    expect((window as unknown as { __xss2?: boolean }).__xss2).toBeUndefined();
  });

  it('テキストをlocalStorageに保存する', () => {
    renderTool();
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '保存されるテキスト' } });
    expect(localStorage.getItem('echoboard-text')).toBe(JSON.stringify('保存されるテキスト'));
  });

  it('ページ再読み込みで前回の入力が復元される', () => {
    localStorage.setItem('echoboard-text', JSON.stringify('前回のテキスト'));
    renderTool();
    expect(screen.getByRole('textbox')).toHaveValue('前回のテキスト');
    const display = screen.getByRole('region', { name: '読み上げ用テキスト' });
    expect(display.textContent).toContain('前回のテキスト');
  });

  it('クリアボタンで入力とDOM表示がリセットされる', () => {
    renderTool();
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '消えるテキスト' } });
    fireEvent.click(screen.getByRole('button', { name: 'クリア' }));
    expect(screen.getByRole('textbox')).toHaveValue('');
    const display = screen.getByRole('region', { name: '読み上げ用テキスト' });
    expect(display.textContent).toContain('ここにテキストが表示されます');
  });

  it('未入力時はクリアボタンが無効になる', () => {
    renderTool();
    expect(screen.getByRole('button', { name: 'クリア' })).toBeDisabled();
  });
});