import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// React マウント前にテーマを確定してフラッシュを防ぐ
const theme = localStorage.getItem('oneshot-theme') ?? 'dark'
document.documentElement.dataset.osTheme = theme

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)