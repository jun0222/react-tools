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
import MermaidTool from './tools/mermaid/Mermaid';
import Blueprint from './tools/blueprint/Blueprint';
import Pacer from './tools/pacer/Pacer';
import Clips from './tools/clips/Clips';
import Romaji from './tools/romaji/Romaji';
import Stencil from './tools/stencil/Stencil';
import Todo from './tools/todo/Todo';
import Draft from './tools/draft/Draft';
import Minutes from './tools/minutes/Minutes';
import LogTree from './tools/logtree/LogTree';
import Visu from './tools/visu/Visu';
import Bookmarks from './tools/bookmarks/Bookmarks';
import Snip from './tools/snip/Snip';
import WordMemo from './tools/wordmemo/WordMemo';
import ErrLog from './tools/errlog/ErrLog';
import Sketch from './tools/sketch/Sketch';
import Diary from './tools/diary/Diary';
import Pad from './tools/pad/Pad';
import Commit from './tools/commit/Commit';
import Args from './tools/args/Args';
import Slideshow from './tools/slideshow/Slideshow';
import Shinsho from './tools/shinsho/Shinsho';
import Prose from './tools/prose/Prose';

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
            <Route path="/mermaid" element={<MermaidTool />} />
            <Route path="/blueprint" element={<Blueprint />} />
            <Route path="/pacer" element={<Pacer />} />
            <Route path="/clips" element={<Clips />} />
            <Route path="/romaji" element={<Romaji />} />
            <Route path="/stencil" element={<Stencil />} />
            <Route path="/todo" element={<Todo />} />
            <Route path="/draft" element={<Draft />} />
            <Route path="/minutes" element={<Minutes />} />
            <Route path="/logtree" element={<LogTree />} />
            <Route path="/visu" element={<Visu />} />
            <Route path="/bookmarks" element={<Bookmarks />} />
            <Route path="/snip" element={<Snip />} />
            <Route path="/wordmemo" element={<WordMemo />} />
            <Route path="/errlog" element={<ErrLog />} />
            <Route path="/sketch" element={<Sketch />} />
            <Route path="/diary" element={<Diary />} />
            <Route path="/args" element={<Args />} />
            <Route path="/pad" element={<Pad />} />
            <Route path="/commit" element={<Commit />} />
            <Route path="/slideshow" element={<Slideshow />} />
            <Route path="/shinsho" element={<Shinsho />} />
            <Route path="/prose" element={<Prose />} />
          </Routes>
        </ThemeProvider>
      </MetaProvider>
    </BrowserRouter>
  );
}

export default App;