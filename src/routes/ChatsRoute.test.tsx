import { act, fireEvent, render, screen } from '@testing-library/react'
import { createMemoryRouter } from 'react-router'
import { RouterProvider } from 'react-router/dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type {
  DirectConversationSummary,
  FlockChatSummary,
} from '@src/types/chat'
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
const directConversationsQuery = vi.hoisted(() => ({
  data: undefined as DirectConversationSummary[] | undefined,
  isError: false,
  isFetching: false,
  isPending: false,
  refetch: vi.fn(),
}))
const directChat = vi.hoisted(() => ({
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
const useDirectChatMock = vi.hoisted(() => vi.fn(() => directChat))
const runnerSearchQuery = vi.hoisted(() => ({
  data: [
    { display_name: 'Maya Chen', user_id: 'maya-id' },
    { display_name: 'Current Runner', user_id: 'runner-id' },
  ],
  isError: false,
  isFetching: false,
}))
const useRunnerSearchMock = vi.hoisted(() => vi.fn(() => runnerSearchQuery))
const startDirectConversation = vi.hoisted(() => ({
  isError: false,
  isPending: false,
  mutateAsync: vi.fn(async () => 'maya-conversation-id'),
  reset: vi.fn(),
  variables: undefined as string | undefined,
}))

vi.mock('@src/hooks/useFlockChats', () => ({
  useFlockChats: () => flocksQuery,
}))

vi.mock('@src/hooks/useFlockChat', () => ({
  useFlockChat: useFlockChatMock,
}))

vi.mock('@src/hooks/useDirectConversations', () => ({
  useDirectConversations: () => directConversationsQuery,
  useStartDirectConversation: () => startDirectConversation,
}))

vi.mock('@src/hooks/useDirectChat', () => ({
  useDirectChat: useDirectChatMock,
}))

vi.mock('@src/hooks/useDiscoverySearch', () => ({
  useRunnerSearch: useRunnerSearchMock,
}))

vi.mock('@src/hooks/useAuthSession', () => ({
  useAuthSession: () => ({ session: { user: { id: 'runner-id' } } }),
}))

function renderChatsRoute(path = '/chats') {
  const router = createMemoryRouter(
    [
      { path: '/chats', element: <ChatsRoute /> },
      { path: '/chats/direct/new', element: <ChatsRoute /> },
      { path: '/chats/direct/:conversationId', element: <ChatsRoute /> },
      { path: '/chats/:flockId', element: <ChatsRoute /> },
    ],
    { initialEntries: [path] },
  )
  render(<RouterProvider router={router} />)
  return router
}

describe('ChatsRoute', () => {
  beforeEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
    flocksQuery.data = [
      { id: 'morning-runners-id', name: 'Morning Runners' },
      { id: 'trail-birds-id', name: 'Trail Birds' },
    ]
    flocksQuery.isError = false
    flocksQuery.isFetching = false
    flocksQuery.isPending = false
    directConversationsQuery.data = [
      {
        id: 'maya-conversation-id',
        otherDisplayName: 'Maya Chen',
        otherUserId: 'maya-id',
      },
    ]
    directConversationsQuery.isError = false
    directConversationsQuery.isFetching = false
    directConversationsQuery.isPending = false
    startDirectConversation.isError = false
    startDirectConversation.isPending = false
    startDirectConversation.variables = undefined
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
    expect(screen.getByText(/do not have access/)).toBeVisible()
  })

  it('loads a known private conversation without loading flock messages', () => {
    renderChatsRoute('/chats/direct/maya-conversation-id')

    expect(document.title).toBe('Maya Chen — Flock')
    expect(useDirectChatMock).toHaveBeenLastCalledWith(
      'maya-conversation-id',
      true,
    )
    expect(useFlockChatMock).toHaveBeenLastCalledWith(undefined, false)
    expect(
      screen.getByRole('heading', { name: 'Maya Chen' }),
    ).toBeInTheDocument()
  })

  it('does not load messages for a direct conversation outside the list', () => {
    renderChatsRoute('/chats/direct/private-conversation-id')

    expect(document.title).toBe('Conversation unavailable — Flock')
    expect(useDirectChatMock).toHaveBeenCalledWith(
      'private-conversation-id',
      false,
    )
    expect(screen.getByText(/do not have access/)).toBeVisible()
  })

  it('starts a private conversation from runner search', async () => {
    vi.useFakeTimers()
    const router = renderChatsRoute('/chats/direct/new')

    expect(document.title).toBe('New direct message — Flock')
    fireEvent.change(
      screen.getByRole('searchbox', {
        name: 'Search runners for a direct message',
      }),
      { target: { value: 'Maya' } },
    )
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300)
    })
    expect(useRunnerSearchMock).toHaveBeenLastCalledWith('Maya')
    expect(screen.queryByText('Current Runner')).not.toBeInTheDocument()

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Maya Chen/ }))
    })

    expect(startDirectConversation.mutateAsync).toHaveBeenCalledWith('maya-id')
    expect(router.state.location.pathname).toBe(
      '/chats/direct/maya-conversation-id',
    )
  })

  it('keeps list failure recoverable', () => {
    flocksQuery.data = undefined
    flocksQuery.isError = true
    renderChatsRoute()

    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(flocksQuery.refetch).toHaveBeenCalledOnce()
  })
})
