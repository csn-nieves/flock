import { render, screen } from '@testing-library/react'
import { createMemoryRouter } from 'react-router'
import { RouterProvider } from 'react-router/dom'
import { describe, expect, it, vi } from 'vitest'
import { routes } from './router'

vi.mock('@src/hooks/useAuthSession', () => ({
  useAuthSession: () => ({
    error: null,
    isLoading: false,
    session: { user: { id: 'runner-id' } },
  }),
}))

vi.mock('@src/hooks/useFlocks', () => ({
  useFlocks: () => ({
    data: [],
    error: null,
    isError: false,
    isFetching: false,
    isPending: false,
    refetch: vi.fn(),
  }),
}))

vi.mock('@src/hooks/useDiscoverySearch', () => ({
  useFlockSearch: () => ({
    data: [],
    isError: false,
    isPending: false,
  }),
  useRunnerSearch: () => ({
    data: [],
    isError: false,
    isPending: false,
  }),
}))

vi.mock('virtual:pwa-register/react', () => ({
  useRegisterSW: () => ({
    needRefresh: [false, vi.fn()],
    offlineReady: [false, vi.fn()],
    updateServiceWorker: vi.fn(),
  }),
}))

describe('App', () => {
  it('renders the flock collection at the protected index route', async () => {
    const router = createMemoryRouter(routes, {
      initialEntries: ['/'],
    })

    render(<RouterProvider router={router} />)

    expect(
      screen.getByRole('main', { name: 'Flock application' }),
    ).toBeInTheDocument()
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Your flocks' }),
    ).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/')
    expect(
      screen.queryByText('A new version of Flock is ready.'),
    ).not.toBeInTheDocument()
  })

  it('loads a secondary protected route on demand', async () => {
    const router = createMemoryRouter(routes, {
      initialEntries: ['/discover'],
    })

    render(<RouterProvider router={router} />)

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Discover' }),
    ).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/discover')
  })
})
