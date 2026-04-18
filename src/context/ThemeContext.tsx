import { createContext, useContext, useState } from 'react';

const THEME_KEY = 'oneshot-theme';

interface ThemeContextValue {
  dark: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  dark: true,
  toggleTheme: () => {},
});

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [dark, setDark] = useState<boolean>(
    () => localStorage.getItem(THEME_KEY) !== 'light'
  );

  const toggleTheme = () => {
    setDark(prev => {
      const next = !prev;
      document.documentElement.dataset.osTheme = next ? 'dark' : 'light';
      localStorage.setItem(THEME_KEY, next ? 'dark' : 'light');
      return next;
    });
  };

  return (
    <ThemeContext.Provider value={{ dark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);