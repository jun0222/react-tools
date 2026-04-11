import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './home/Home';
import OneShot from './tools/oneshot/OneShot';

const THEME_KEY = 'oneshot-theme';

const sunIcon = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
    <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
  </svg>
);

const moonIcon = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
  </svg>
);

function App() {
  const [dark, setDark] = useState(() => localStorage.getItem(THEME_KEY) !== 'light');

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.dataset.osTheme = next ? 'dark' : 'light';
    localStorage.setItem(THEME_KEY, next ? 'dark' : 'light');
  };

  return (
    <BrowserRouter>
      <button
        onClick={toggleTheme}
        title="テーマ切替"
        style={{
          position: 'fixed',
          top: 16,
          right: 16,
          zIndex: 9999,
          width: 40,
          height: 40,
          borderRadius: '50%',
          border: `1.5px solid ${dark ? '#2e2e3e' : '#e0e0e8'}`,
          background: dark ? '#1a1a24' : '#ffffff',
          color: dark ? '#e0e0e0' : '#1a1a2e',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
          transition: 'all 0.2s',
        }}
      >
        {dark ? sunIcon : moonIcon}
      </button>
      <Routes>
        <Route path="/" element={<Home dark={dark} />} />
        <Route path="/oneshot" element={<OneShot dark={dark} />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;