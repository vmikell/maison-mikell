import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

const canonicalHost = 'maison-reset.firebaseapp.com'

if (typeof window !== 'undefined' && window.location.hostname !== canonicalHost) {
  const nextUrl = new URL(window.location.href)
  nextUrl.protocol = 'https:'
  nextUrl.host = canonicalHost
  window.location.replace(nextUrl.toString())
} else {
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}
