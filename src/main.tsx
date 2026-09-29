import { QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router/dom'
import { AuthSessionProvider } from '@src/auth/AuthSessionProvider'
import { createAppQueryClient } from '@src/data/queryClient'
import '@src/styles/global.css'
import router from './router'

const rootElement = document.getElementById('root')
const queryClient = createAppQueryClient()

if (!rootElement) {
  throw new Error('Root element was not found')
}

createRoot(rootElement).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthSessionProvider>
        <RouterProvider router={router} />
      </AuthSessionProvider>
    </QueryClientProvider>
  </StrictMode>,
)
