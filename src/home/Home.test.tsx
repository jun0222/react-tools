import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, beforeEach } from 'vitest';
import { ThemeProvider } from '../context/ThemeContext';
import { MetaProvider } from '../context/MetaContext';
import Home from './Home';

const THEME_KEY = 'oneshot-theme';

beforeEach(() => localStorage.clear());

const setup = (dark = false) => {
  localStorage.setItem(THEME_KEY, dark ? 'dark' : 'light');
  return render(
    <MemoryRouter>
      <MetaProvider>
        <ThemeProvider>
          <Home />
        </ThemeProvider>
      </MetaProvider>
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

  it('グループヘッダー「プロンプト作成」が表示される', () => {
    setup();
    expect(screen.getByRole('heading', { name: /プロンプト作成/ })).toBeInTheDocument();
  });

  it('グループヘッダー「テキスト加工」が表示される', () => {
    setup();
    expect(screen.getByRole('heading', { name: /テキスト加工/ })).toBeInTheDocument();
  });

  it('グループヘッダー「図・可視化」が表示される', () => {
    setup();
    expect(screen.getByRole('heading', { name: /図・可視化/ })).toBeInTheDocument();
  });

  it('LexisはプロンプトグループにOneShotと一緒に表示される', () => {
    setup();
    const group = screen.getByRole('region', { name: 'プロンプト作成' });
    expect(group).toHaveTextContent('Lexis');
    expect(group).toHaveTextContent('OneShot');
  });

  it('Forgeはテキスト加工グループに表示される', () => {
    setup();
    const group = screen.getByRole('region', { name: 'テキスト加工' });
    expect(group).toHaveTextContent('Forge');
  });

  it('検索時はグループをまたいでマッチしたツールが表示される', () => {
    setup();
    const searchInput = screen.getByRole('searchbox');
    fireEvent.change(searchInput, { target: { value: 'lexis' } });
    expect(screen.getByText('Lexis')).toBeInTheDocument();
    expect(screen.queryByText('OneShot')).not.toBeInTheDocument();
  });
});