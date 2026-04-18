import { describe, it, expect, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { MetaProvider } from './context/MetaContext';
import Home from './home/Home';
import OneShot from './tools/oneshot/OneShot';
import Phantom from './tools/phantom/Phantom';

const THEME_KEY = 'oneshot-theme';

const renderPage = (ui: React.ReactElement, dark = true) => {
  localStorage.setItem(THEME_KEY, dark ? 'dark' : 'light');
  return render(
    <MemoryRouter>
      <MetaProvider>
        <ThemeProvider>
          {ui}
        </ThemeProvider>
      </MetaProvider>
    </MemoryRouter>
  );
};

describe('UI スナップショット', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('Home', () => {
    it('ダークモード', () => {
      const { container } = renderPage(<Home />, true);
      expect(container.firstChild).toMatchSnapshot();
    });

    it('ライトモード', () => {
      const { container } = renderPage(<Home />, false);
      expect(container.firstChild).toMatchSnapshot();
    });
  });

  describe('OneShot', () => {
    it('ダークモード（空の状態）', () => {
      const { container } = renderPage(<OneShot />, true);
      expect(container.firstChild).toMatchSnapshot();
    });

    it('ライトモード（空の状態）', () => {
      const { container } = renderPage(<OneShot />, false);
      expect(container.firstChild).toMatchSnapshot();
    });
  });

  describe('Phantom', () => {
    it('ダークモード', () => {
      const { container } = renderPage(<Phantom />, true);
      expect(container.firstChild).toMatchSnapshot();
    });

    it('ライトモード', () => {
      const { container } = renderPage(<Phantom />, false);
      expect(container.firstChild).toMatchSnapshot();
    });
  });
});