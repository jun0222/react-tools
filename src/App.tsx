import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './home/Home';
import OneShot from './tools/oneshot/OneShot';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/oneshot" element={<OneShot />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
