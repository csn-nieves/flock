import { useState, type ReactNode } from 'react'

import ChatsPage from './chats/ChatsPage'
import type { DirectConversationSummary, FlockMessage } from '@src/types/chat'

const flocks = [
  {
    id: 'morning-runners-id',
    latestMessageAt: '2026-10-08T13:42:00Z',
    latestMessagePreview: 'Meet at the west entrance.',
    latestSenderDisplayName: 'Local Runner',
    latestSenderId: 'runner-id',
    name: 'Morning Runners',
    unreadCount: 3,
  },
  {
    id: 'trail-birds-id',
    latestMessageAt: '2026-10-07T18:15:00Z',
    latestMessagePreview: 'The trail is clear.',
    latestSenderDisplayName: 'Local Organizer',
    latestSenderId: 'owner-id',
    name: 'Trail Birds',
    unreadCount: 0,
  },
  {
    id: 'sunday-long-run-id',
    latestMessageAt: null,
    latestMessagePreview: null,
    latestSenderDisplayName: null,
    latestSenderId: null,
    name: 'Sunday Long Run',
    unreadCount: 0,
  },
]

const directConversations: DirectConversationSummary[] = [
  {
    id: 'maya-chen-conversation-id',
    latestMessageAt: '2026-10-08T14:12:00Z',
    latestMessagePreview: 'See you in the morning.',
    latestSenderDisplayName: 'Maya Chen',
    latestSenderId: 'maya-chen-id',
    otherDisplayName: 'Maya Chen',
    otherUserId: 'maya-chen-id',
    unreadCount: 1,
  },
]

const commonProps = {
  currentUserId: 'owner-id',
  directConversations: {
    conversations: directConversations,
    isRefreshing: false,
    status: 'ready' as const,
  },
  isStartingDirectMessage: false,
  onSelectDirectConversation: () => undefined,
  onStartDirectMessage: () => undefined,
}

function createChatMessage(sequence: number): FlockMessage {
  const isOwner = sequence % 2 === 0
  return {
    body:
      sequence === 1
        ? 'Does 7:00 at the east trailhead work?'
        : `Run planning message ${sequence}`,
    createdAt: `2026-10-07T12:${String(sequence).padStart(2, '0')}:00.000Z`,
    flockId: flocks[0].id,
    id: `message-${sequence}`,
    reactions:
      sequence === 1 ? [{ count: 1, isSelected: false, key: 'heart' }] : [],
    senderDisplayName: isOwner ? 'Local Organizer' : 'Local Runner',
    senderId: isOwner ? 'owner-id' : 'runner-id',
  }
}

function Canvas({ children }: { children: ReactNode }) {
  return (
    <main className="h-dvh w-full overflow-hidden px-4 sm:px-8">
      {children}
    </main>
  )
}

export function SelectedFlock() {
  const [selectedFlockId, setSelectedFlockId] = useState(flocks[0].id)
  const [messages, setMessages] = useState<FlockMessage[]>([
    createChatMessage(1),
    createChatMessage(2),
  ])
  const selectedFlock = flocks.find(({ id }) => id === selectedFlockId)

  return (
    <Canvas>
      <ChatsPage
        {...commonProps}
        chat={
          selectedFlock
            ? {
                connectionStatus: 'live',
                currentUserId: 'owner-id',
                hasOlderMessages: false,
                isLoading: false,
                isLoadingOlderMessages: false,
                isSending: false,
                messages,
                onLoadOlderMessages: async () => undefined,
                onRetry: () => undefined,
                onSend: async (body) => {
                  setMessages((current) => [
                    ...current,
                    {
                      ...createChatMessage(current.length + 1),
                      body,
                      id: `sent-${current.length + 1}`,
                      senderDisplayName: 'Local Organizer',
                      senderId: 'owner-id',
                    },
                  ])
                },
                onToggleReaction: async () => undefined,
              }
            : undefined
        }
        flockChats={{ flocks, isRefreshing: false, status: 'ready' }}
        onBackToList={() => setSelectedFlockId('')}
        onSelectFlock={setSelectedFlockId}
        selectedFlock={selectedFlock}
        selectedFlockId={selectedFlockId || undefined}
      />
    </Canvas>
  )
}

export function ChatHistory() {
  const [hasOlderMessages, setHasOlderMessages] = useState(true)
  const [messages, setMessages] = useState<FlockMessage[]>(
    Array.from({ length: 30 }, (_, index) => createChatMessage(index + 7)),
  )

  return (
    <Canvas>
      <ChatsPage
        {...commonProps}
        chat={{
          connectionStatus: 'live',
          currentUserId: 'owner-id',
          hasOlderMessages,
          isLoading: false,
          isLoadingOlderMessages: false,
          isSending: false,
          messages,
          onLoadOlderMessages: async () => {
            setMessages((current) => [
              ...Array.from({ length: 6 }, (_, index) =>
                createChatMessage(index + 1),
              ),
              ...current,
            ])
            setHasOlderMessages(false)
          },
          onRetry: () => undefined,
          onSend: async () => undefined,
        }}
        flockChats={{ flocks, isRefreshing: false, status: 'ready' }}
        onBackToList={() => undefined}
        onSelectFlock={() => undefined}
        selectedFlock={flocks[0]}
        selectedFlockId={flocks[0].id}
      />
    </Canvas>
  )
}

export function Empty() {
  return (
    <Canvas>
      <ChatsPage
        {...commonProps}
        flockChats={{ flocks: [], isRefreshing: false, status: 'ready' }}
        onBackToList={() => undefined}
        onSelectFlock={() => undefined}
      />
    </Canvas>
  )
}

export function Loading() {
  return (
    <Canvas>
      <ChatsPage
        {...commonProps}
        flockChats={{ status: 'loading' }}
        onBackToList={() => undefined}
        onSelectFlock={() => undefined}
      />
    </Canvas>
  )
}

export function Error() {
  const [intent, setIntent] = useState('')
  return (
    <Canvas>
      <ChatsPage
        {...commonProps}
        flockChats={{
          isRetrying: false,
          onRetry: () => setIntent('retry'),
          status: 'error',
        }}
        onBackToList={() => undefined}
        onSelectFlock={() => undefined}
      />
      <output className="sr-only" data-testid="page-intent">
        {intent}
      </output>
    </Canvas>
  )
}

export function SelectedDirectMessage() {
  const [messages, setMessages] = useState<FlockMessage[]>([
    createChatMessage(1),
    createChatMessage(2),
  ])
  const selectedDirectConversation = directConversations[0]

  return (
    <Canvas>
      <ChatsPage
        {...commonProps}
        chat={{
          connectionStatus: 'live',
          currentUserId: 'owner-id',
          hasOlderMessages: false,
          isLoading: false,
          isLoadingOlderMessages: false,
          isSending: false,
          messages,
          onLoadOlderMessages: async () => undefined,
          onRetry: () => undefined,
          onSend: async (body) => {
            setMessages((current) => [
              ...current,
              {
                ...createChatMessage(current.length + 1),
                body,
                id: `direct-${current.length + 1}`,
                senderDisplayName: 'Local Organizer',
                senderId: 'owner-id',
              },
            ])
          },
        }}
        flockChats={{ flocks, isRefreshing: false, status: 'ready' }}
        onBackToList={() => undefined}
        onSelectFlock={() => undefined}
        selectedDirectConversation={selectedDirectConversation}
        selectedDirectConversationId={selectedDirectConversation.id}
      />
    </Canvas>
  )
}

export function NewDirectMessage() {
  return (
    <Canvas>
      <ChatsPage
        {...commonProps}
        directMessageStarter={{
          isComposing: false,
          isSearching: false,
          isStarting: false,
          onCompositionChange: () => undefined,
          onSearchTermChange: () => undefined,
          onSelectRunner: async () => undefined,
          results: [
            {
              display_name: 'Maya Chen',
              user_id: 'maya-chen-id',
            },
          ],
          searchTerm: 'Maya',
        }}
        flockChats={{ flocks, isRefreshing: false, status: 'ready' }}
        isStartingDirectMessage
        onBackToList={() => undefined}
        onSelectFlock={() => undefined}
      />
    </Canvas>
  )
}
