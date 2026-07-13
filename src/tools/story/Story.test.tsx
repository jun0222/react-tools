import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '../../context/ThemeContext';
import { MetaProvider } from '../../context/MetaContext';
import Story from './Story';

const renderTool = () =>
  render(
    <MemoryRouter>
      <MetaProvider>
        <ThemeProvider>
          <Story />
        </ThemeProvider>
      </MetaProvider>
    </MemoryRouter>,
  );

describe('Story', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('テンプレートのプルダウンに3種類の選択肢がある', () => {
    renderTool();
    expect(screen.getByRole('option', { name: '三幕構成' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: '起承転結' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'ヒーローズ・ジャーニー' })).toBeInTheDocument();
  });

  it('未入力のときコピーボタンが無効になる', () => {
    renderTool();
    expect(screen.getByRole('button', { name: 'プロンプトをコピー' })).toBeDisabled();
  });

  it('断片を入力するとプレビューに反映される', () => {
    renderTool();
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '孤独な発明家の話' } });
    const preview = screen.getByRole('region', { name: 'プロンプトプレビュー' });
    expect(preview.textContent).toContain('孤独な発明家の話');
    expect(preview.textContent).toContain('三幕構成');
  });

  it('テンプレートを切り替えるとプレビューが変わる', () => {
    renderTool();
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '断片' } });
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'kishotenketsu' } });
    const preview = screen.getByRole('region', { name: 'プロンプトプレビュー' });
    expect(preview.textContent).toContain('起承転結');
    expect(preview.textContent).toContain('起：');
  });

  it('学習モードのチェックボックスがある', () => {
    renderTool();
    expect(screen.getByRole('checkbox', { name: '学習モード' })).toBeInTheDocument();
  });

  it('学習モードをONにするとプレビューに反映される', () => {
    renderTool();
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '断片' } });
    fireEvent.click(screen.getByRole('checkbox', { name: '学習モード' }));
    const preview = screen.getByRole('region', { name: 'プロンプトプレビュー' });
    expect(preview.textContent).toContain('学習モード');
    expect(preview.textContent).toContain('記憶に定着');
  });

  it('コピーボタンを押すとクリップボードにプロンプトが書き込まれる', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText } });

    renderTool();
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '断片テキスト' } });
    fireEvent.click(screen.getByRole('button', { name: 'プロンプトをコピー' }));

    await vi.waitFor(() => {
      expect(writeText).toHaveBeenCalledOnce();
      expect(writeText.mock.calls[0][0]).toContain('断片テキスト');
    });
  });

  it('入力・テンプレート・学習モードをlocalStorageに保存し復元する', () => {
    renderTool();
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '保存される断片' } });
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'heros-journey' } });
    fireEvent.click(screen.getByRole('checkbox', { name: '学習モード' }));

    expect(localStorage.getItem('story-fragments')).toBe(JSON.stringify('保存される断片'));
    expect(localStorage.getItem('story-template')).toBe(JSON.stringify('heros-journey'));
    expect(localStorage.getItem('story-learning')).toBe(JSON.stringify(true));
  });
});
