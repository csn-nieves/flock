import type { Session } from '@supabase/supabase-js'
import { render, screen } from '@testing-library/react'
import { StrictMode } from 'react'
import { createMemoryRouter } from 'react-router'
import { RouterProvider } from 'react-router/dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import ProtectedRoute from './ProtectedRoute'

const authSession = vi.hoisted(() => ({
  isLoading: false,
  session: null as Session | null,
}))

vi.mock('@src/hooks/useAuthSession', () => ({
  useAuthSession: () => authSession,
}))

vi.mock('@src/hooks/useFlockChats', () => ({
  useFlockChats: () => ({
    data: [],
    isError: false,
    isFetching: false,
    isPending: false,
  }),
}))

const destination = vi.hoisted(() => ({
  preserveAuthDestination: vi.fn(),
}))

vi.mock('./destination', () => destination)

function renderProtectedRoute({ strict = false } = {}) {
  const router = createMemoryRouter(
    [
      {
        path: '/',
        element: <ProtectedRoute />,
        children: [
          {
            path: 'flocks/:flockId',
            element: <p>Sunday runners</p>,
          },
        ],
      },
      {
        path: '/sign-in',
        element: <p>Sign in page</p>,
      },
    ],
    {
      initialEntries: ['/flocks/sunday-runners?invite=abc123#members'],
    },
  )
  const route = <RouterProvider router={router} />

  render(strict ? <StrictMode>{route}</StrictMode> : route)

  return router
}

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    authSession.isLoading = false
    authSession.session = null
  })

  it('shows an honest loading state without rendering private content', () => {
    authSession.isLoading = true
    renderProtectedRoute()

    expect(document.title).toBe('Loading… — Flock')
    expect(
      screen.getByRole('heading', { level: 1, name: 'Getting Flock ready' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent(
      'Checking your session…',
    )
    expect(screen.queryByText('Sunday runners')).not.toBeInTheDocument()
    expect(destination.preserveAuthDestination).not.toHaveBeenCalled()
  })

  it('renders private content for an authenticated runner', () => {
    authSession.session = { user: { id: 'runner-id' } } as Session
    renderProtectedRoute()

    expect(screen.getByText('Sunday runners')).toBeInTheDocument()
    expect(destination.preserveAuthDestination).not.toHaveBeenCalled()
  })

  it('preserves the complete location and replaces it with sign-in', async () => {
    const router = renderProtectedRoute({ strict: true })

    expect(await screen.findByText('Sign in page')).toBeInTheDocument()
    expect(destination.preserveAuthDestination).toHaveBeenCalledOnce()
    expect(destination.preserveAuthDestination).toHaveBeenCalledWith(
      '/flocks/sunday-runners?invite=abc123#members',
    )
    expect(router.state.location.pathname).toBe('/sign-in')
    expect(router.state.historyAction).toBe('REPLACE')
    expect(screen.queryByText('Sunday runners')).not.toBeInTheDocument()
  })
})
