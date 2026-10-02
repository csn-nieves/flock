import { fireEvent, render, screen } from '@testing-library/react'
import { createMemoryRouter } from 'react-router'
import { RouterProvider } from 'react-router/dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { FlockSummary } from '@src/types/flocks'
import FlocksRoute from './FlocksRoute'

const flocksQuery = vi.hoisted(() => ({
  data: undefined as FlockSummary[] | undefined,
  error: null as Error | null,
  isError: false,
  isFetching: false,
  isPending: false,
  refetch: vi.fn(),
}))
const createFlockMutation = vi.hoisted(() => ({
  isError: false,
  isPending: false,
  mutate: vi.fn(),
}))

vi.mock('@src/hooks/useFlocks', () => ({
  useFlocks: () => flocksQuery,
}))
vi.mock('@src/hooks/useCreateFlock', () => ({
  useCreateFlock: () => createFlockMutation,
}))

const flocks: FlockSummary[] = [
  {
    id: 'morning-runners-id',
    name: 'Morning Runners',
    owner_id: 'owner-id',
  },
]

function renderFlocksRoute() {
  const router = createMemoryRouter(
    [
      {
        path: '/flocks',
        element: <FlocksRoute />,
      },
      {
        path: '/flocks/new',
        element: <p>Create flock destination</p>,
      },
      {
        path: '/flocks/:flockId',
        element: <p>Flock detail destination</p>,
      },
    ],
    { initialEntries: ['/flocks'] },
  )

  render(<RouterProvider router={router} />)

  return router
}

describe('FlocksRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    flocksQuery.data = flocks
    flocksQuery.error = null
    flocksQuery.isError = false
    flocksQuery.isFetching = false
    flocksQuery.isPending = false
  })

  it('shows an honest initial loading state', () => {
    flocksQuery.data = undefined
    flocksQuery.isFetching = true
    flocksQuery.isPending = true
    renderFlocksRoute()

    expect(document.title).toBe('Loading flocks… — Flock')
    expect(
      screen.getByRole('heading', { level: 1, name: 'Your flocks' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Loading your flocks…')
    expect(screen.queryByRole('list')).not.toBeInTheDocument()
  })

  it('renders visible flocks and forwards selection to their detail path', async () => {
    const router = renderFlocksRoute()

    expect(document.title).toBe('Your flocks — Flock')
    expect(
      screen.getByRole('button', { name: 'Open Morning Runners' }),
    ).toBeVisible()

    fireEvent.click(
      screen.getByRole('button', { name: 'Open Morning Runners' }),
    )

    expect(await screen.findByText('Flock detail destination')).toBeVisible()
    expect(router.state.location.pathname).toBe('/flocks/morning-runners-id')
  })

  it('keeps visible flocks available during a background refresh', () => {
    flocksQuery.isFetching = true
    renderFlocksRoute()

    expect(
      screen.getByRole('button', { name: 'Open Morning Runners' }),
    ).toBeVisible()
    expect(screen.getByRole('status')).toHaveTextContent(
      'Refreshing your flocks…',
    )
  })

  it('presents an empty state and forwards creation intent', async () => {
    flocksQuery.data = []
    const router = renderFlocksRoute()

    expect(
      screen.getByRole('heading', { level: 2, name: 'No flocks yet' }),
    ).toBeVisible()
    expect(screen.queryByRole('list')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Create a flock' }))

    expect(await screen.findByRole('dialog')).toBeVisible()
    expect(screen.getByRole('textbox', { name: 'Flock name' })).toBeVisible()
    expect(router.state.location.pathname).toBe('/flocks')
  })

  it('presents safe query recovery and retries without exposing internals', () => {
    flocksQuery.data = undefined
    flocksQuery.error = new Error('raw database failure')
    flocksQuery.isError = true
    renderFlocksRoute()

    expect(document.title).toBe('Flocks unavailable — Flock')
    expect(screen.getByRole('alert')).toHaveTextContent(
      'We could not load your flocks. Check your connection and try again.',
    )
    expect(screen.queryByText('raw database failure')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(flocksQuery.refetch).toHaveBeenCalledOnce()
  })

  it('shows pending retry progress and prevents duplicate activation', () => {
    flocksQuery.data = undefined
    flocksQuery.error = new Error('raw database failure')
    flocksQuery.isError = true
    flocksQuery.isFetching = true
    renderFlocksRoute()

    const retryButton = screen.getByRole('button', { name: 'Trying again' })
    expect(retryButton).toBeDisabled()
    expect(retryButton).toHaveAttribute('aria-busy', 'true')
    expect(screen.getByRole('status')).toHaveTextContent('Trying again')

    fireEvent.click(retryButton)
    expect(flocksQuery.refetch).not.toHaveBeenCalled()
  })
})
