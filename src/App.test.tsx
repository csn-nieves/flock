import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import App from './App'

vi.mock('virtual:pwa-register/react', () => ({
  useRegisterSW: () => ({
    needRefresh: [false, vi.fn()],
    offlineReady: [false, vi.fn()],
    updateServiceWorker: vi.fn(),
  }),
}))

describe('App', () => {
  it('renders the empty application shell', () => {
    render(<App />)

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
