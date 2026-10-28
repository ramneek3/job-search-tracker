import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBackend } from '@/api/backend'
import { App } from './App'
import './index.css'

createBackend().then((backend) =>
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App backend={backend} />
    </StrictMode>,
  ),
)
