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

vi.mock('virtual:pwa-register/react', () => ({
  useRegisterSW: () => ({
    needRefresh: [false, vi.fn()],
    offlineReady: [false, vi.fn()],
    updateServiceWorker: vi.fn(),
  }),
}))

describe('App', () => {
  it('renders the empty application shell at the index route', () => {
    const router = createMemoryRouter(routes, {
      initialEntries: ['/'],
    })

    render(<RouterProvider router={router} />)

    expect(
      screen.getByRole('main', { name: 'Flock application' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { level: 1, name: 'Flock' }),
    ).toBeInTheDocument()
    expect(
      screen.queryByText('A new version of Flock is ready.'),
    ).not.toBeInTheDocument()
  })
})
