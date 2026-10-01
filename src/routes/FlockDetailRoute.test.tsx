import { fireEvent, render, screen } from '@testing-library/react'
import { createMemoryRouter } from 'react-router'
import { RouterProvider } from 'react-router/dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { FlockSummary } from '@src/types/flocks'
import FlockDetailRoute from './FlockDetailRoute'

const flockQuery = vi.hoisted(() => ({
  data: undefined as FlockSummary | null | undefined,
  error: null as Error | null,
  isError: false,
  isFetching: false,
  isPending: false,
  refetch: vi.fn(),
}))
const useFlockMock = vi.hoisted(() => vi.fn(() => flockQuery))

vi.mock('@src/hooks/useFlock', () => ({
  useFlock: useFlockMock,
}))

const flock: FlockSummary = {
  id: 'morning-runners-id',
  name: 'Morning Runners',
  owner_id: 'owner-id',
}

function renderFlockDetailRoute(path = `/flocks/${flock.id}`) {
  const router = createMemoryRouter(
    [
      {
        path: '/flocks/:flockId?',
        element: <FlockDetailRoute />,
      },
      {
        path: '/flocks/:flockId/invitations/new',
        element: <p>Create invitation destination</p>,
      },
    ],
    { initialEntries: [path] },
  )

  render(<RouterProvider router={router} />)

  return router
}

describe('FlockDetailRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    flockQuery.data = flock
    flockQuery.error = null
    flockQuery.isError = false
    flockQuery.isFetching = false
    flockQuery.isPending = false
  })

  it('loads the flock identified by the route and renders its pure page', () => {
    renderFlockDetailRoute()

    expect(useFlockMock).toHaveBeenCalledWith(flock.id)
    expect(document.title).toBe('Morning Runners — Flock')
    expect(
      screen.getByRole('heading', { level: 1, name: 'Morning Runners' }),
    ).toBeVisible()
  })

  it('opens invitation creation for the visible flock', async () => {
    const router = renderFlockDetailRoute()

    fireEvent.click(screen.getByRole('button', { name: 'Invite a runner' }))

    expect(
      await screen.findByText('Create invitation destination'),
    ).toBeVisible()
    expect(router.state.location.pathname).toBe(
      '/flocks/morning-runners-id/invitations/new',
    )
  })

  it('shows an honest initial loading state', () => {
    flockQuery.data = undefined
    flockQuery.isFetching = true
    flockQuery.isPending = true
    renderFlockDetailRoute()

    expect(document.title).toBe('Loading flock… — Flock')
    expect(screen.getByRole('status')).toHaveTextContent('Loading flock…')
  })

  it('does not distinguish a missing flock from one hidden by RLS', () => {
    flockQuery.data = null
    renderFlockDetailRoute('/flocks/hidden-flock-id')

    expect(document.title).toBe('Flock not found — Flock')
    expect(
      screen.getByRole('heading', { level: 1, name: 'Flock not found' }),
    ).toBeVisible()
    expect(screen.getByText(/may not have access/)).toBeVisible()
  })

  it('treats a missing route identifier as not found without querying', () => {
    renderFlockDetailRoute('/flocks')

    expect(useFlockMock).toHaveBeenCalledWith(undefined)
    expect(document.title).toBe('Flock not found — Flock')
    expect(
      screen.getByRole('heading', { level: 1, name: 'Flock not found' }),
    ).toBeVisible()
  })

  it('presents safe recovery and retries without exposing internals', () => {
    flockQuery.data = undefined
    flockQuery.error = new Error('raw database failure')
    flockQuery.isError = true
    renderFlockDetailRoute()

    expect(document.title).toBe('Flock unavailable — Flock')
    expect(screen.getByRole('alert')).toHaveTextContent(
      'We could not load this flock. Check your connection and try again.',
    )
    expect(screen.queryByText('raw database failure')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(flockQuery.refetch).toHaveBeenCalledOnce()
  })

  it('keeps visible data during a background refresh', () => {
    flockQuery.isFetching = true
    renderFlockDetailRoute()

    expect(
      screen.getByRole('heading', { level: 1, name: 'Morning Runners' }),
    ).toBeVisible()
    expect(screen.getByRole('status')).toHaveTextContent('Refreshing flock…')
  })

  it('blocks duplicate retry activation while retrying', () => {
    flockQuery.data = undefined
    flockQuery.error = new Error('raw database failure')
    flockQuery.isError = true
    flockQuery.isFetching = true
    renderFlockDetailRoute()

    const retryButton = screen.getByRole('button', { name: 'Trying again' })
    expect(retryButton).toBeDisabled()
    expect(retryButton).toHaveAttribute('aria-busy', 'true')

    fireEvent.click(retryButton)
    expect(flockQuery.refetch).not.toHaveBeenCalled()
  })
})
