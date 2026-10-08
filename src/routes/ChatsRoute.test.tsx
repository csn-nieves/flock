import { fireEvent, render, screen } from '@testing-library/react'
import { createMemoryRouter } from 'react-router'
import { RouterProvider } from 'react-router/dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { FlockChatSummary } from '@src/types/chat'
import ChatsRoute from './ChatsRoute'

const flocksQuery = vi.hoisted(() => ({
  data: undefined as FlockChatSummary[] | undefined,
  isError: false,
  isFetching: false,
  isPending: false,
  refetch: vi.fn(),
}))
const flockChat = vi.hoisted(() => ({
  connectionStatus: 'live' as const,
  hasOlderMessages: false,
  isError: false,
  isLoading: false,
  isLoadingOlderMessages: false,
  isSending: false,
  loadOlderMessages: vi.fn(),
  messages: [],
  retry: vi.fn(),
  send: vi.fn(),
  sendError: null,
}))
const useFlockChatMock = vi.hoisted(() => vi.fn(() => flockChat))

vi.mock('@src/hooks/useFlockChats', () => ({
  useFlockChats: () => flocksQuery,
}))

vi.mock('@src/hooks/useFlockChat', () => ({
  useFlockChat: useFlockChatMock,
}))

vi.mock('@src/hooks/useAuthSession', () => ({
  useAuthSession: () => ({ session: { user: { id: 'runner-id' } } }),
}))

function renderChatsRoute(path = '/chats') {
  const router = createMemoryRouter(
    [
      { path: '/chats', element: <ChatsRoute /> },
      { path: '/chats/:flockId', element: <ChatsRoute /> },
    ],
    { initialEntries: [path] },
  )
  render(<RouterProvider router={router} />)
  return router
}

describe('ChatsRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    flocksQuery.data = [
      { id: 'morning-runners-id', name: 'Morning Runners' },
      { id: 'trail-birds-id', name: 'Trail Birds' },
    ]
    flocksQuery.isError = false
    flocksQuery.isFetching = false
    flocksQuery.isPending = false
  })

  it('opens the chat workspace and routes flock selection', async () => {
    const router = renderChatsRoute()

    expect(document.title).toBe('Chats — Flock')
    fireEvent.click(screen.getByRole('button', { name: /Morning Runners/ }))

    expect(router.state.location.pathname).toBe('/chats/morning-runners-id')
    expect(document.title).toBe('Morning Runners chat — Flock')
    expect(useFlockChatMock).toHaveBeenLastCalledWith(
      'morning-runners-id',
      true,
    )
  })

  it('does not load messages for a flock outside the current membership list', () => {
    renderChatsRoute('/chats/private-flock-id')

    expect(document.title).toBe('Conversation unavailable — Flock')
    expect(useFlockChatMock).toHaveBeenCalledWith('private-flock-id', false)
    expect(screen.getByText(/no longer be a member/)).toBeVisible()
  })

  it('keeps list failure recoverable', () => {
    flocksQuery.data = undefined
    flocksQuery.isError = true
    renderChatsRoute()

    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(flocksQuery.refetch).toHaveBeenCalledOnce()
  })
})
