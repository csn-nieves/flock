import { fireEvent, render, screen } from '@testing-library/react'
import { createMemoryRouter } from 'react-router'
import { RouterProvider } from 'react-router/dom'
import { describe, expect, it, vi } from 'vitest'
import AppShell from './AppShell'

vi.mock('@src/hooks/useAuthSession', () => ({
  useAuthSession: () => ({
    session: {
      user: {
        id: 'runner-id',
        user_metadata: { display_name: 'Local Runner' },
      },
    },
  }),
}))

vi.mock('@src/hooks/useConversationDirectorySync', () => ({
  useConversationDirectorySync: vi.fn(),
}))

vi.mock('@src/hooks/useFlockChats', () => ({
  useFlockChats: () => ({
    data: [
      {
        id: 'morning-runners-id',
        latestMessageAt: null,
        latestMessagePreview: null,
        latestSenderDisplayName: null,
        latestSenderId: null,
        name: 'Morning Runners',
        unreadCount: 0,
      },
    ],
    isError: false,
    isFetching: false,
    isPending: false,
  }),
}))

vi.mock('@src/hooks/useDirectConversations', () => ({
  useDirectConversations: () => ({
    data: [
      {
        id: 'maya-conversation-id',
        latestMessageAt: null,
        latestMessagePreview: null,
        latestSenderDisplayName: null,
        latestSenderId: null,
        otherDisplayName: 'Maya Chen',
        otherUserId: 'maya-id',
        unreadCount: 0,
      },
    ],
    isError: false,
    isFetching: false,
    isPending: false,
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
    expect(
      screen.queryByRole('link', { name: 'Chats' }),
    ).not.toBeInTheDocument()
    expect(
      screen.getAllByRole('heading', { name: 'Flock chats' }).length,
    ).toBeGreaterThan(0)
    expect(
      screen.getAllByRole('link', { name: /Morning Runners/ }).length,
    ).toBeGreaterThan(0)
    expect(
      screen.getAllByRole('heading', { name: 'Direct messages' }).length,
    ).toBeGreaterThan(0)
    expect(
      screen.getAllByRole('link', { name: /Maya Chen/ }).length,
    ).toBeGreaterThan(0)
    expect(
      screen.getAllByRole('link', { name: 'New direct message' }).length,
    ).toBeGreaterThan(0)
    expect(screen.getAllByText('Local').length).toBeGreaterThan(0)
    expect(screen.getByRole('complementary')).toHaveClass(
      'h-dvh',
      'max-h-dvh',
      'sticky',
      'top-0',
    )
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
