import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router/dom'
import { AuthSessionProvider } from '@src/auth/AuthSessionProvider'
import '@src/styles/global.css'
import router from './router'

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('Root element was not found')
}

createRoot(rootElement).render(
  <StrictMode>
    <AuthSessionProvider>
      <RouterProvider router={router} />
    </AuthSessionProvider>
  </StrictMode>,
)
