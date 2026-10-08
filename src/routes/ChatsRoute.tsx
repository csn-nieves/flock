import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router'

import { useAuthSession } from '@src/hooks/useAuthSession'
import { useFlockChat } from '@src/hooks/useFlockChat'
import { useFlockChats } from '@src/hooks/useFlockChats'
import ChatsPage, { type FlockChatListState } from '@src/pages/chats/ChatsPage'

function ChatsRoute() {
  const { flockId } = useParams<{ flockId: string }>()
  const navigate = useNavigate()
  const { session } = useAuthSession()
  const flocksQuery = useFlockChats()
  const selectedFlock = flocksQuery.data?.find((flock) => flock.id === flockId)
  const flockChat = useFlockChat(flockId, selectedFlock !== undefined)

  let flockChats: FlockChatListState
  if (flocksQuery.data !== undefined) {
    flockChats = {
      flocks: flocksQuery.data,
      isRefreshing: flocksQuery.isFetching,
      status: 'ready',
    }
  } else if (flocksQuery.isPending) {
    flockChats = { status: 'loading' }
  } else {
    flockChats = {
      isRetrying: flocksQuery.isFetching,
      onRetry: () => void flocksQuery.refetch(),
      status: 'error',
    }
  }

  let title = 'Chats — Flock'
  if (flockId && flocksQuery.isPending) title = 'Loading conversation… — Flock'
  if (flockId && flocksQuery.isError) title = 'Chats unavailable — Flock'
  if (flockId && flocksQuery.data && !selectedFlock) {
    title = 'Conversation unavailable — Flock'
  }
  if (selectedFlock) title = `${selectedFlock.name} chat — Flock`

  useEffect(() => {
    document.title = title
    return () => {
      document.title = 'Flock'
    }
  }, [title])

  return (
    <ChatsPage
      chat={
        selectedFlock && session?.user.id
          ? {
              connectionStatus: flockChat.connectionStatus,
              currentUserId: session.user.id,
              error: flockChat.isError
                ? 'Messages are unavailable. Check your connection and try again.'
                : undefined,
              hasOlderMessages: flockChat.hasOlderMessages,
              isLoading: flockChat.isLoading,
              isLoadingOlderMessages: flockChat.isLoadingOlderMessages,
              isSending: flockChat.isSending,
              messages: flockChat.messages,
              onLoadOlderMessages: flockChat.loadOlderMessages,
              onRetry: flockChat.retry,
              onSend: flockChat.send,
              sendError: flockChat.sendError
                ? 'Your message was not sent. Check your connection and try again.'
                : undefined,
            }
          : undefined
      }
      flockChats={flockChats}
      onBackToList={() => navigate('/chats')}
      onSelectFlock={(selectedFlockId) =>
        navigate(`/chats/${encodeURIComponent(selectedFlockId)}`)
      }
      selectedFlock={selectedFlock}
      selectedFlockId={flockId}
    />
  )
}

export default ChatsRoute
