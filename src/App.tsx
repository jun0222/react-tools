import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './home/Home';
import OneShot from './tools/oneshot/OneShot';

const THEME_KEY = 'oneshot-theme';

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
      <Routes>
        <Route path="/" element={<Home dark={dark} onToggleTheme={toggleTheme} />} />
        <Route path="/oneshot" element={<OneShot dark={dark} onToggleTheme={toggleTheme} />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;