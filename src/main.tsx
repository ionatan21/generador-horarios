import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './i18n'
import App from './App.tsx'
import NotFound from './components/NotFound.tsx'

const isKnownPath = window.location.pathname === '/'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isKnownPath ? <App /> : <NotFound />}
  </StrictMode>,
)
