import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Split } from 'lucide-react';
import { ThemeProvider } from '../../context/ThemeContext';
import { MetaProvider } from '../../context/MetaContext';
import PromptTool from './PromptTool';

const buildPrompt = (word: string) => {
  const w = word.trim();
  if (!w) return '（入力してください）';
  return `テスト用プロンプト: ${w}`;
};

const renderTool = () =>
  render(
    <MemoryRouter>
      <MetaProvider>
        <ThemeProvider>
          <PromptTool
            name="TestTool"
            icon={<Split size={20} color="white" />}
            iconBg="linear-gradient(135deg, #f43f5e, #f97316)"
            accent="#f43f5e"
            storageKey="testtool-word"
            placeholder="単語・概念を入力…"
            buildPrompt={buildPrompt}
          />
        </ThemeProvider>
      </MetaProvider>
    </MemoryRouter>,
  );

describe('PromptTool', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('渡したnameが見出しに表示される', () => {
    renderTool();
    expect(screen.getByText('TestTool')).toBeInTheDocument();
  });

  it('単語未入力のときコピーボタンが無効になる', () => {
    renderTool();
    expect(screen.getByRole('button', { name: 'プロンプトをコピー' })).toBeDisabled();
  });

  it('単語を入力するとコピーボタンが有効になる', () => {
    renderTool();
    fireEvent.change(screen.getByPlaceholderText('単語・概念を入力…'), { target: { value: '再帰' } });
    expect(screen.getByRole('button', { name: 'プロンプトをコピー' })).not.toBeDisabled();
  });

  it('渡したbuildPromptの結果がプレビューに反映される', () => {
    renderTool();
    fireEvent.change(screen.getByPlaceholderText('単語・概念を入力…'), { target: { value: 'ポインタ' } });
    const preview = screen.getByRole('region', { name: 'プロンプトプレビュー' });
    expect(preview.textContent).toContain('テスト用プロンプト: ポインタ');
  });

  it('渡したstorageKeyでlocalStorageに保存する', () => {
    renderTool();
    fireEvent.change(screen.getByPlaceholderText('単語・概念を入力…'), { target: { value: 'クロージャ' } });
    expect(localStorage.getItem('testtool-word')).toBe(JSON.stringify('クロージャ'));
  });

  it('ページ再読み込みで前回の入力が復元される', () => {
    localStorage.setItem('testtool-word', JSON.stringify('カリー化'));
    renderTool();
    expect((screen.getByPlaceholderText('単語・概念を入力…') as HTMLInputElement).value).toBe('カリー化');
  });

  it('コピーボタンを押すとクリップボードにプロンプトが書き込まれる', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText } });

    renderTool();
    fireEvent.change(screen.getByPlaceholderText('単語・概念を入力…'), { target: { value: 'メモ化' } });
    fireEvent.click(screen.getByRole('button', { name: 'プロンプトをコピー' }));

    await vi.waitFor(() => {
      expect(writeText).toHaveBeenCalledOnce();
      expect(writeText.mock.calls[0][0]).toContain('メモ化');
    });
  });
});
