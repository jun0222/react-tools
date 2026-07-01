import { describe, it, expect, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { MetaProvider } from './context/MetaContext';
import Home from './home/Home';
import OneShot from './tools/oneshot/OneShot';
import Phantom from './tools/phantom/Phantom';
import Lexis from './tools/lexis/Lexis';
import Nippo from './tools/nippo/Nippo';
import Grok from './tools/grok/Grok';
import Pattern from './tools/pattern/Pattern';

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

  describe('Lexis', () => {
    it('ダークモード（空の状態）', () => {
      const { container } = renderPage(<Lexis />, true);
      expect(container.firstChild).toMatchSnapshot();
    });

    it('ライトモード（空の状態）', () => {
      const { container } = renderPage(<Lexis />, false);
      expect(container.firstChild).toMatchSnapshot();
    });
  });

  describe('Nippo', () => {
    it('ダークモード（空の状態）', () => {
      const { container } = renderPage(<Nippo />, true);
      expect(container.firstChild).toMatchSnapshot();
    });

    it('ライトモード（空の状態）', () => {
      const { container } = renderPage(<Nippo />, false);
      expect(container.firstChild).toMatchSnapshot();
    });
  });

  describe('Grok', () => {
    it('ダークモード（空の状態）', () => {
      const { container } = renderPage(<Grok />, true);
      expect(container.firstChild).toMatchSnapshot();
    });

    it('ライトモード（空の状態）', () => {
      const { container } = renderPage(<Grok />, false);
      expect(container.firstChild).toMatchSnapshot();
    });
  });

  describe('Pattern', () => {
    it('ダークモード（空の状態）', () => {
      const { container } = renderPage(<Pattern />, true);
      expect(container.firstChild).toMatchSnapshot();
    });

    it('ライトモード（空の状態）', () => {
      const { container } = renderPage(<Pattern />, false);
      expect(container.firstChild).toMatchSnapshot();
    });
  });
});