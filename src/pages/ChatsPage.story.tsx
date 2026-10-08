import { useState, type ReactNode } from 'react'

import ChatsPage from './chats/ChatsPage'
import type { FlockMessage } from '@src/types/chat'

const flocks = [
  { id: 'morning-runners-id', name: 'Morning Runners' },
  { id: 'trail-birds-id', name: 'Trail Birds' },
  { id: 'sunday-long-run-id', name: 'Sunday Long Run' },
]

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
