import { fireEvent, render, screen } from '@testing-library/react'
import { createMemoryRouter } from 'react-router'
import { RouterProvider } from 'react-router/dom'
import { describe, expect, it, vi } from 'vitest'
import AppShell from './AppShell'

vi.mock('@src/hooks/useAuthSession', () => ({
  useAuthSession: () => ({
    session: { user: { user_metadata: { display_name: 'Local Runner' } } },
  }),
}))

function renderShell(path = '/flocks') {
  const router = createMemoryRouter([{ path: '*', element: <AppShell /> }], {
    initialEntries: [path],
  })
  render(<RouterProvider router={router} />)
  return router
}

describe('AppShell', () => {
  it('renders global navigation and profile identity', () => {
    renderShell()
    expect(screen.getAllByRole('link', { name: 'Flock home' }).length).toBe(2)
    expect(
      screen.getAllByRole('link', { name: 'Flocks' }).length,
    ).toBeGreaterThan(0)
    expect(
      screen.getAllByRole('link', { name: 'Events' }).length,
    ).toBeGreaterThan(0)
    expect(screen.getAllByText('Local').length).toBeGreaterThan(0)
  })

  it('opens and closes the mobile menu with Escape', () => {
    renderShell()
    const menuButton = screen.getByRole('button', { name: 'Open menu' })
    fireEvent.click(menuButton)
    expect(
      screen.getByRole('navigation', { name: 'Mobile navigation' }),
    ).toBeVisible()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(
      screen.queryByRole('navigation', { name: 'Mobile navigation' }),
    ).not.toBeInTheDocument()
  })
})
