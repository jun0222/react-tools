import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import Home from './Home';

const setup = (dark = false) =>
  render(
    <MemoryRouter>
      <Home dark={dark} />
    </MemoryRouter>
  );

describe('Home', () => {
  it('タイトルが表示される', () => {
    setup();
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });

  it('dark=true のとき .dark クラスが付く', () => {
    const { container } = setup(true);
    expect(container.querySelector('.home')).toHaveClass('dark');
  });

  it('dark=false のとき .light クラスが付く', () => {
    const { container } = setup(false);
    expect(container.querySelector('.home')).toHaveClass('light');
  });

  it('ツール一覧が表示される', () => {
    setup();
    expect(screen.getByText('OneShot')).toBeInTheDocument();
  });

  it('OneShot カードが /oneshot へのリンクを持つ', () => {
    setup();
    const link = screen.getByRole('link', { name: /OneShot/ });
    expect(link).toHaveAttribute('href', '/oneshot');
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