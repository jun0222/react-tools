import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '../../context/ThemeContext';
import { MetaProvider } from '../../context/MetaContext';
import Nippo from './Nippo';

const renderNippo = () =>
  render(
    <MemoryRouter>
      <MetaProvider>
        <ThemeProvider>
          <Nippo />
        </ThemeProvider>
      </MetaProvider>
    </MemoryRouter>,
  );

describe('Nippo', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('初期状態でコピーボタンが無効になる', () => {
    renderNippo();
    expect(screen.getByRole('button', { name: 'サマリをコピー' })).toBeDisabled();
  });

  it('エントリを入力するとコピーボタンが有効になる', () => {
    renderNippo();
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '・朝会 9:00~9:30 完了' } });
    expect(screen.getByRole('button', { name: 'サマリをコピー' })).not.toBeDisabled();
  });

  it('テキストをlocalStorageに保存する', () => {
    renderNippo();
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '・朝会' } });
    expect(localStorage.getItem('nippo-text')).toBe(JSON.stringify('・朝会'));
  });

  it('ページ再読み込みで前回の入力が復元される', () => {
    localStorage.setItem('nippo-text', JSON.stringify('・設計 10:00~11:00 完了'));
    renderNippo();
    expect((screen.getByRole('textbox') as HTMLTextAreaElement).value).toBe('・設計 10:00~11:00 完了');
  });

  it('コピーボタンを押すとクリップボードにサマリが書き込まれる', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText } });

    renderNippo();
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '・朝会 9:00~9:30 完了' } });
    fireEvent.click(screen.getByRole('button', { name: 'サマリをコピー' }));

    await vi.waitFor(() => {
      expect(writeText).toHaveBeenCalledOnce();
      const text: string = writeText.mock.calls[0][0];
      expect(text).toContain('【完了】');
      expect(text).toContain('・朝会');
    });
  });

  it('コピーされたサマリに時刻は含まれない', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText } });

    renderNippo();
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '・朝会 9:00~9:30 完了' } });
    fireEvent.click(screen.getByRole('button', { name: 'サマリをコピー' }));

    await vi.waitFor(() => {
      const text: string = writeText.mock.calls[0][0];
      expect(text).not.toContain('9:00');
      expect(text).not.toContain('9:30');
    });
  });

  it('時刻なしのエントリもガントチャートに表示される', () => {
    renderNippo();
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '・タスク' } });
    const gantt = screen.getByRole('region', { name: 'ガントチャート' });
    expect(gantt.querySelector('.np-gantt-bar--no-time')).not.toBeNull();
  });

  it('完了・進行中・未着手がサマリパネルに表示される', () => {
    renderNippo();
    fireEvent.change(screen.getByRole('textbox'), {
      target: {
        value: '・朝会 9:00~9:30 完了\n・設計 10:00~11:00 進行中\n・テスト',
      },
    });
    const summary = screen.getByRole('region', { name: 'サマリ' });
    expect(summary.textContent).toContain('完了');
    expect(summary.textContent).toContain('進行中');
    expect(summary.textContent).toContain('未着手');
  });

  it('エントリが0件でもサマリパネルに全グループが表示される', () => {
    renderNippo();
    const summary = screen.getByRole('region', { name: 'サマリ' });
    expect(summary.textContent).toContain('完了');
    expect(summary.textContent).toContain('進行中');
    expect(summary.textContent).toContain('未着手');
  });

  it('コピーされたタイムスタンプに曜日が含まれる', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText } });
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 6, 1, 23, 3)); // 水曜日

    renderNippo();
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '・朝会 完了' } });
    fireEvent.click(screen.getByRole('button', { name: 'サマリをコピー' }));

    await vi.waitFor(() => {
      const text: string = writeText.mock.calls[0][0];
      expect(text).toContain('(水)');
    });
    vi.useRealTimers();
  });
});