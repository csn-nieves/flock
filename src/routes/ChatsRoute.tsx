import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router'

import { useAuthSession } from '@src/hooks/useAuthSession'
import { useDebouncedValue } from '@src/hooks/useDebouncedValue'
import { useDirectChat } from '@src/hooks/useDirectChat'
import {
  useDirectConversations,
  useStartDirectConversation,
} from '@src/hooks/useDirectConversations'
import { useFlockChat } from '@src/hooks/useFlockChat'
import { useFlockChats } from '@src/hooks/useFlockChats'
import { useRunnerSearch } from '@src/hooks/useDiscoverySearch'
import ChatsPage, {
  type DirectConversationListState,
  type FlockChatListState,
} from '@src/pages/chats/ChatsPage'

function ChatsRoute() {
  const { conversationId, flockId } = useParams<{
    conversationId?: string
    flockId?: string
  }>()
  const location = useLocation()
  const navigate = useNavigate()
  const { session } = useAuthSession()
  const [runnerSearchTerm, setRunnerSearchTerm] = useState('')
  const [isSearchComposing, setIsSearchComposing] = useState(false)
  const debouncedRunnerSearchTerm = useDebouncedValue(
    runnerSearchTerm,
    300,
    !isSearchComposing,
  )
  const isStartingDirectMessage = location.pathname === '/chats/direct/new'
  const flocksQuery = useFlockChats()
  const directConversationsQuery = useDirectConversations()
  const runnerSearchQuery = useRunnerSearch(
    isStartingDirectMessage ? debouncedRunnerSearchTerm : '',
  )
  const startDirectConversation = useStartDirectConversation()
  const selectedFlock = flocksQuery.data?.find((flock) => flock.id === flockId)
  const selectedDirectConversation = directConversationsQuery.data?.find(
    (conversation) => conversation.id === conversationId,
  )
  const flockChat = useFlockChat(flockId, selectedFlock !== undefined)
  const directChat = useDirectChat(
    conversationId,
    selectedDirectConversation !== undefined,
  )
  const activeChat = selectedDirectConversation ? directChat : flockChat

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

  let directConversations: DirectConversationListState
  if (directConversationsQuery.data !== undefined) {
    directConversations = {
      conversations: directConversationsQuery.data,
      isRefreshing: directConversationsQuery.isFetching,
      status: 'ready',
    }
  } else if (directConversationsQuery.isPending) {
    directConversations = { status: 'loading' }
  } else {
    directConversations = {
      isRetrying: directConversationsQuery.isFetching,
      onRetry: () => void directConversationsQuery.refetch(),
      status: 'error',
    }
  }

  let title = 'Chats — Flock'
  if (isStartingDirectMessage) title = 'New direct message — Flock'
  if (flockId && flocksQuery.isPending) {
    title = 'Loading conversation… — Flock'
  }
  if (flockId && flocksQuery.isError) title = 'Chats unavailable — Flock'
  if (flockId && flocksQuery.data && !selectedFlock) {
    title = 'Conversation unavailable — Flock'
  }
  if (selectedFlock) title = `${selectedFlock.name} chat — Flock`
  if (conversationId && directConversationsQuery.isPending) {
    title = 'Loading conversation… — Flock'
  }
  if (conversationId && directConversationsQuery.isError) {
    title = 'Chats unavailable — Flock'
  }
  if (
    conversationId &&
    directConversationsQuery.data &&
    !selectedDirectConversation
  ) {
    title = 'Conversation unavailable — Flock'
  }
  if (selectedDirectConversation) {
    title = `${selectedDirectConversation.otherDisplayName} — Flock`
  }

  useEffect(() => {
    document.title = title
    return () => {
      document.title = 'Flock'
    }
  }, [title])

  const normalizedRunnerSearchTerm = runnerSearchTerm.trim()
  const isRunnerSearchSettled =
    normalizedRunnerSearchTerm.length >= 2 &&
    normalizedRunnerSearchTerm === debouncedRunnerSearchTerm.trim() &&
    !isSearchComposing
  const runnerResults = isRunnerSearchSettled
    ? (runnerSearchQuery.data ?? []).filter(
        (runner) => runner.user_id !== session?.user.id,
      )
    : []

  return (
    <ChatsPage
      chat={
        (selectedFlock || selectedDirectConversation) && session?.user.id
          ? {
              connectionStatus: activeChat.connectionStatus,
              currentUserId: session.user.id,
              error: activeChat.isError
                ? 'Messages are unavailable. Check your connection and try again.'
                : undefined,
              hasOlderMessages: activeChat.hasOlderMessages,
              isLoading: activeChat.isLoading,
              isLoadingOlderMessages: activeChat.isLoadingOlderMessages,
              isSending: activeChat.isSending,
              messages: activeChat.messages,
              onLoadOlderMessages: activeChat.loadOlderMessages,
              onRetry: activeChat.retry,
              onSend: activeChat.send,
              sendError: activeChat.sendError
                ? 'Your message was not sent. Check your connection and try again.'
                : undefined,
            }
          : undefined
      }
      directConversations={directConversations}
      directMessageStarter={
        isStartingDirectMessage
          ? {
              isComposing: isSearchComposing,
              isSearching:
                normalizedRunnerSearchTerm.length >= 2 &&
                (!isRunnerSearchSettled || runnerSearchQuery.isFetching),
              isStarting: startDirectConversation.isPending,
              onCompositionChange: setIsSearchComposing,
              onSearchTermChange: (term) => {
                setRunnerSearchTerm(term)
                startDirectConversation.reset()
              },
              onSelectRunner: async (runner) => {
                const nextConversationId =
                  await startDirectConversation.mutateAsync(runner.user_id)
                setRunnerSearchTerm('')
                navigate(
                  `/chats/direct/${encodeURIComponent(nextConversationId)}`,
                )
              },
              results: runnerResults,
              searchError:
                isRunnerSearchSettled && runnerSearchQuery.isError
                  ? 'Check your connection and try the search again.'
                  : undefined,
              searchTerm: runnerSearchTerm,
              startError: startDirectConversation.isError
                ? 'Check your connection and choose the runner again.'
                : undefined,
              startingUserId: startDirectConversation.variables,
            }
          : undefined
      }
      flockChats={flockChats}
      isStartingDirectMessage={isStartingDirectMessage}
      selectedDirectConversation={selectedDirectConversation}
      selectedDirectConversationId={conversationId}
      selectedFlock={selectedFlock}
      selectedFlockId={flockId}
      onBackToList={() => navigate('/chats')}
      onSelectDirectConversation={(selectedConversationId) =>
        navigate(`/chats/direct/${encodeURIComponent(selectedConversationId)}`)
      }
      onSelectFlock={(selectedFlockId) =>
        navigate(`/chats/${encodeURIComponent(selectedFlockId)}`)
      }
      onStartDirectMessage={() => navigate('/chats/direct/new')}
    />
  )
}

export default ChatsRoute
