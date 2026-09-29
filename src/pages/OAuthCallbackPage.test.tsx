import { fireEvent, render, screen } from '@testing-library/react'
import { createMemoryRouter } from 'react-router'
import { RouterProvider } from 'react-router/dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useOAuthCallbackController } from '@src/hooks/useOAuthCallbackController'
import OAuthCallbackPage from './OAuthCallbackPage'

const callbackController = vi.hoisted(() => ({
  error: undefined as string | undefined,
  status: 'loading' as 'error' | 'loading' | 'success',
}))

vi.mock('@src/hooks/useOAuthCallbackController', () => ({
  useOAuthCallbackController: vi.fn(() => callbackController),
}))

const destination = vi.hoisted(() => ({
  consumeAuthDestination: vi.fn(() => '/'),
}))

vi.mock('@src/auth/destination', () => destination)

function renderCallbackRoute(
  initialEntry = '/auth/callback?code=callback-code',
) {
  const router = createMemoryRouter(
    [
      {
        path: '/',
        element: <p>Flock home</p>,
      },
      {
        path: '/sign-in',
        element: <p>Sign in page</p>,
      },
      {
        path: '/flocks/:flockId/events/:eventId',
        element: <p>Run details</p>,
      },
      {
        path: '/auth/callback',
        element: <OAuthCallbackPage />,
      },
    ],
    { initialEntries: [initialEntry] },
  )

  render(<RouterProvider router={router} />)

  return router
}

describe('OAuthCallbackPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    callbackController.error = undefined
    callbackController.status = 'loading'
    destination.consumeAuthDestination.mockReturnValue('/')
  })

  it('shows an honest loading state and removes callback parameters', async () => {
    const router = renderCallbackRoute(
      '/auth/callback?code=secret-code&state=provider-state',
    )

    expect(document.title).toBe('Finishing sign-in — Flock')
    expect(
      screen.getByRole('heading', { level: 1, name: 'Finishing sign-in' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent(
      'Securely connecting your account…',
    )
    expect(router.state.location.pathname).toBe('/auth/callback')
    expect(router.state.location.search).toBe('')
    expect(vi.mocked(useOAuthCallbackController)).toHaveBeenCalledWith({
      authorizationCode: 'secret-code',
      hasProviderError: false,
    })
  })

  it('returns to the complete saved destination after success', async () => {
    callbackController.status = 'success'
    destination.consumeAuthDestination.mockReturnValue(
      '/flocks/sunday-runners/events/tempo-run?pace=9%3A00#route-map',
    )
    const router = renderCallbackRoute()

    expect(await screen.findByText('Run details')).toBeInTheDocument()
    expect(router.state.location.pathname).toBe(
      '/flocks/sunday-runners/events/tempo-run',
    )
    expect(router.state.location.search).toBe('?pace=9%3A00')
    expect(router.state.location.hash).toBe('#route-map')
    expect(router.state.historyAction).toBe('REPLACE')
    expect(destination.consumeAuthDestination).toHaveBeenCalledOnce()
  })

  it('shows safe recovery guidance and returns to sign-in', async () => {
    callbackController.status = 'error'
    callbackController.error =
      'We could not finish social sign-in. Return to sign in and try again.'
    const router = renderCallbackRoute(
      '/auth/callback?error=access_denied&error_description=raw-provider-message',
    )

    expect(document.title).toBe('Sign-in problem — Flock')
    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'Sign-in did not finish',
      }),
    ).toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent(
      'We could not finish social sign-in. Return to sign in and try again.',
    )
    expect(screen.queryByText('raw-provider-message')).not.toBeInTheDocument()
    expect(router.state.location.search).toBe('')
    expect(destination.consumeAuthDestination).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: 'Return to sign in' }))

    expect(await screen.findByText('Sign in page')).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/sign-in')
    expect(router.state.historyAction).toBe('REPLACE')
  })

  it('recognizes and removes provider errors returned in the fragment', () => {
    callbackController.status = 'error'
    callbackController.error =
      'Social sign-in was canceled or could not be completed. Return to sign in and try again.'
    const router = renderCallbackRoute(
      '/auth/callback#error=access_denied&error_description=raw-provider-message',
    )

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Social sign-in was canceled or could not be completed.',
    )
    expect(router.state.location.hash).toBe('')
    expect(vi.mocked(useOAuthCallbackController)).toHaveBeenCalledWith({
      authorizationCode: null,
      hasProviderError: true,
    })
  })
})
