import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { MetaProvider, useMeta } from './context/MetaContext';
import { PAGE_META } from './config/pageMeta';
import AppHeader from './AppHeader';
import Home from './home/Home';
import OneShot from './tools/oneshot/OneShot';
import Phantom from './tools/phantom/Phantom';
import Forge from './tools/forge/Forge';
import Erd from './tools/erd/Erd';

const MetaManager = () => {
  const { pathname } = useLocation();
  const { setMeta } = useMeta();
  useEffect(() => {
    const m = PAGE_META[pathname] ?? PAGE_META['/'];
    setMeta(m);
  }, [pathname, setMeta]);
  return null;
};

function App() {
  return (
    <BrowserRouter>
      <MetaProvider>
        <ThemeProvider>
          <MetaManager />
          <AppHeader />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/oneshot" element={<OneShot />} />
            <Route path="/phantom" element={<Phantom />} />
            <Route path="/forge" element={<Forge />} />
            <Route path="/erd" element={<Erd />} />
          </Routes>
        </ThemeProvider>
      </MetaProvider>
    </BrowserRouter>
  );
}

export default App;