import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, beforeEach } from 'vitest';
import { ThemeProvider } from '../context/ThemeContext';
import Home from './Home';

const THEME_KEY = 'oneshot-theme';

beforeEach(() => localStorage.clear());

const setup = (dark = false) => {
  localStorage.setItem(THEME_KEY, dark ? 'dark' : 'light');
  return render(
    <MemoryRouter>
      <ThemeProvider>
        <Home />
      </ThemeProvider>
    </MemoryRouter>
  );
};

describe('Home', () => {
  it('タイトルが表示される', () => {
    setup();
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });

  it('ダークモードのとき .dark クラスが付く', () => {
    const { container } = setup(true);
    expect(container.querySelector('.home')).toHaveClass('dark');
  });

  it('ライトモードのとき .light クラスが付く', () => {
    const { container } = setup(false);
    expect(container.querySelector('.home')).toHaveClass('light');
  });

  it('ツール一覧が表示される', () => {
    setup();
    expect(screen.getByText('OneShot')).toBeInTheDocument();
    expect(screen.getByText('Phantom')).toBeInTheDocument();
  });

  it('OneShot カードが /oneshot へのリンクを持つ', () => {
    setup();
    const link = screen.getByRole('link', { name: /OneShot/ });
    expect(link).toHaveAttribute('href', '/oneshot');
  });

  it('Phantom カードが /phantom へのリンクを持つ', () => {
    setup();
    const link = screen.getByRole('link', { name: /Phantom/ });
    expect(link).toHaveAttribute('href', '/phantom');
  });

  it('ツール説明文が表示される', () => {
    setup();
    expect(screen.getByText(/プロンプトを保存/)).toBeInTheDocument();
  });

  it('available ツール数が表示される', () => {
    setup();
    expect(screen.getByText(/tool.*available/i)).toBeInTheDocument();
  });
});