import { fireEvent, render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createMemoryRouter } from 'react-router'
import { RouterProvider } from 'react-router/dom'
import { describe, expect, it, vi } from 'vitest'
import AppShell from './AppShell'

const signOutMock = vi.hoisted(() => vi.fn().mockResolvedValue({ error: null }))

vi.mock('@src/data/auth', () => ({ signOut: signOutMock }))

vi.mock('@src/hooks/useAuthSession', () => ({
  useAuthSession: () => ({
    session: {
      user: {
        id: 'runner-id',
        user_metadata: { display_name: 'Session Runner' },
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

vi.mock('@src/hooks/useProfile', () => ({
  useProfile: () => ({
    data: {
      avatarUrl: null,
      displayName: 'Local Runner',
      location: null,
      updatedAt: '2099-01-01T00:00:00.000Z',
      userId: 'runner-id',
    },
  }),
}))

function renderShell(path = '/flocks') {
  const queryClient = new QueryClient()
  const router = createMemoryRouter([{ path: '*', element: <AppShell /> }], {
    initialEntries: [path],
  })
  render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
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
    expect(screen.getAllByText('Local Runner').length).toBeGreaterThan(0)
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

  it('groups profile actions in an account menu', () => {
    renderShell()
    fireEvent.click(
      screen.getByRole('button', {
        name: 'Open account menu',
      }),
    )

    expect(screen.getByRole('link', { name: 'Profile' })).toBeVisible()
    expect(screen.getByRole('link', { name: 'Settings' })).toBeVisible()
    expect(screen.getByRole('button', { name: 'Sign out' })).toHaveClass(
      'bg-danger',
    )
  })

  it('signs out and returns to the sign-in route', async () => {
    const router = renderShell()
    fireEvent.click(
      screen.getByRole('button', {
        name: 'Open account menu',
      }),
    )
    fireEvent.click(screen.getByRole('button', { name: 'Sign out' }))

    await vi.waitFor(() => expect(signOutMock).toHaveBeenCalledOnce())
    expect(router.state.location.pathname).toBe('/sign-in')
  })
})
