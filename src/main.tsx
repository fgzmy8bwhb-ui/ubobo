import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './i18n'
import './index.css'
import { useTheme } from './hooks/useTheme'
import { useSettings } from './hooks/useSettings'
import { useAuth } from './hooks/useAuth'
import { getToken } from './lib/api'

// --- Bootstrap before first paint ---
useTheme.getState().init()
void useSettings.getState().load()
if (getToken()) void useAuth.getState().bootstrap()
else useAuth.setState({ ready: true })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
)
