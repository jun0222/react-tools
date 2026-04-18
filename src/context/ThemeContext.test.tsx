import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { ThemeProvider, useTheme } from './ThemeContext';

const THEME_KEY = 'oneshot-theme';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider>{children}</ThemeProvider>
);

beforeEach(() => localStorage.clear());

// =============================================
// 初期値
// =============================================
describe('ThemeContext / 初期値', () => {
  it('localStorage 未設定のときダークモードで起動する', () => {
    const { result } = renderHook(() => useTheme(), { wrapper });
    expect(result.current.dark).toBe(true);
  });

  it('localStorage に "light" が保存されていればライトモードで起動する', () => {
    localStorage.setItem(THEME_KEY, 'light');
    const { result } = renderHook(() => useTheme(), { wrapper });
    expect(result.current.dark).toBe(false);
  });

  it('localStorage に "dark" が保存されていればダークモードで起動する', () => {
    localStorage.setItem(THEME_KEY, 'dark');
    const { result } = renderHook(() => useTheme(), { wrapper });
    expect(result.current.dark).toBe(true);
  });
});

// =============================================
// テーマ切替
// =============================================
describe('ThemeContext / テーマ切替', () => {
  it('toggleTheme でダーク→ライトに切り替わる', () => {
    const { result } = renderHook(() => useTheme(), { wrapper });
    expect(result.current.dark).toBe(true);
    act(() => result.current.toggleTheme());
    expect(result.current.dark).toBe(false);
  });

  it('toggleTheme でライト→ダークに切り替わる', () => {
    localStorage.setItem(THEME_KEY, 'light');
    const { result } = renderHook(() => useTheme(), { wrapper });
    act(() => result.current.toggleTheme());
    expect(result.current.dark).toBe(true);
  });

  it('切替後に localStorage に "light" が保存される', () => {
    const { result } = renderHook(() => useTheme(), { wrapper });
    act(() => result.current.toggleTheme());
    expect(localStorage.getItem(THEME_KEY)).toBe('light');
  });

  it('切替後に localStorage に "dark" が保存される', () => {
    localStorage.setItem(THEME_KEY, 'light');
    const { result } = renderHook(() => useTheme(), { wrapper });
    act(() => result.current.toggleTheme());
    expect(localStorage.getItem(THEME_KEY)).toBe('dark');
  });

  it('toggleTheme を連続2回呼ぶと元のモードに戻る', () => {
    const { result } = renderHook(() => useTheme(), { wrapper });
    act(() => result.current.toggleTheme());
    act(() => result.current.toggleTheme());
    expect(result.current.dark).toBe(true);
  });
});