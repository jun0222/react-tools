import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '../../context/ThemeContext';
import { MetaProvider } from '../../context/MetaContext';
import Intervalbell from './Intervalbell';

const renderTool = () =>
  render(
    <MemoryRouter>
      <MetaProvider>
        <ThemeProvider>
          <Intervalbell />
        </ThemeProvider>
      </MetaProvider>
    </MemoryRouter>,
  );

describe('Intervalbell', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('間隔入力の初期値は30秒', () => {
    renderTool();
    expect(screen.getByLabelText('間隔（秒）')).toHaveValue(30);
  });

  it('初期状態は「開始」ボタンが表示される', () => {
    renderTool();
    expect(screen.getByRole('button', { name: '開始' })).toBeInTheDocument();
  });

  it('開始を押すと「停止」ボタンに変わる', () => {
    renderTool();
    fireEvent.click(screen.getByRole('button', { name: '開始' }));
    expect(screen.getByRole('button', { name: '停止' })).toBeInTheDocument();
  });

  it('開始中は間隔入力が無効になる', () => {
    renderTool();
    fireEvent.click(screen.getByRole('button', { name: '開始' }));
    expect(screen.getByLabelText('間隔（秒）')).toBeDisabled();
  });

  it('指定間隔が経過するとビープ回数が1増える', () => {
    renderTool();
    fireEvent.change(screen.getByLabelText('間隔（秒）'), { target: { value: '5' } });
    fireEvent.click(screen.getByRole('button', { name: '開始' }));

    act(() => { vi.advanceTimersByTime(5_000); });

    expect(screen.getByText('🔔 1回')).toBeInTheDocument();
  });

  it('複数インターバル経過でビープ回数が増える', () => {
    renderTool();
    fireEvent.change(screen.getByLabelText('間隔（秒）'), { target: { value: '5' } });
    fireEvent.click(screen.getByRole('button', { name: '開始' }));

    act(() => { vi.advanceTimersByTime(12_000); });

    expect(screen.getByText('🔔 2回')).toBeInTheDocument();
  });

  it('サイクル内経過時間が表示され、インターバルごとにリセットされる', () => {
    renderTool();
    fireEvent.change(screen.getByLabelText('間隔（秒）'), { target: { value: '10' } });
    fireEvent.click(screen.getByRole('button', { name: '開始' }));

    act(() => { vi.advanceTimersByTime(4_000); });
    expect(screen.getByText('0:04')).toBeInTheDocument();

    act(() => { vi.advanceTimersByTime(7_000); });
    expect(screen.getByText('0:01')).toBeInTheDocument();
  });

  it('停止を押すとビープが止まり、表示が固定される', () => {
    renderTool();
    fireEvent.change(screen.getByLabelText('間隔（秒）'), { target: { value: '5' } });
    fireEvent.click(screen.getByRole('button', { name: '開始' }));
    act(() => { vi.advanceTimersByTime(3_000); });

    fireEvent.click(screen.getByRole('button', { name: '停止' }));
    act(() => { vi.advanceTimersByTime(10_000); });

    expect(screen.getByText('🔔 0回')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '開始' })).toBeInTheDocument();
  });

  it('間隔をlocalStorageに保存し再読み込みで復元する', () => {
    renderTool();
    fireEvent.change(screen.getByLabelText('間隔（秒）'), { target: { value: '45' } });
    expect(localStorage.getItem('intervalbell-interval')).toBe(JSON.stringify(45));
  });

  it('再読み込み時に前回の間隔設定が復元される', () => {
    localStorage.setItem('intervalbell-interval', JSON.stringify(60));
    renderTool();
    expect(screen.getByLabelText('間隔（秒）')).toHaveValue(60);
  });
});
