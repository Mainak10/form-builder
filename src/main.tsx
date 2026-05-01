import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import '@/pdf/print.css'
import '@/registry/register'
import { initStorage } from '@/storage'
import App from './App.tsx'

initStorage()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
