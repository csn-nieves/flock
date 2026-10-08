import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
  type InfiniteData,
  type QueryKey,
} from '@tanstack/react-query'

import { supabase } from '@src/data/supabase'
import type {
  ChatConnectionStatus,
  ChatMessage,
  ChatMessageCursor,
  ChatMessagePage,
} from '@src/types/chat'

type ChatMessageData<Message extends ChatMessage> = InfiniteData<
  ChatMessagePage<Message>,
  ChatMessageCursor | null
>

type UseChatMessagesOptions<Message extends ChatMessage> = {
  channelName: string
  enabled: boolean
  filterColumn: string
  getMessage: (messageId: string) => Promise<Message>
  getQueryKey: (conversationId: string) => QueryKey
  id: string | undefined
  listMessages: (
    conversationId: string,
    cursor: ChatMessageCursor | null,
  ) => Promise<ChatMessagePage<Message>>
  markRead: (conversationId: string, messageId: string) => Promise<void>
  listQueryKey: QueryKey
  sendMessage: (conversationId: string, body: string) => Promise<Message>
  table: 'direct_messages' | 'flock_messages'
}

function appendMessage<Message extends ChatMessage>(
  data: ChatMessageData<Message> | undefined,
  message: Message,
): ChatMessageData<Message> | undefined {
  if (!data) return data
  if (
    data.pages.some((page) => page.messages.some(({ id }) => id === message.id))
  ) {
    return data
  }

  const [newestPage, ...olderPages] = data.pages
  if (!newestPage) return data

  const nextMessages = [...newestPage.messages, message].sort((left, right) => {
    const dateComparison = left.createdAt.localeCompare(right.createdAt)
    return dateComparison === 0
      ? left.id.localeCompare(right.id)
      : dateComparison
  })

  return {
    ...data,
    pages: [{ ...newestPage, messages: nextMessages }, ...olderPages],
  }
}

export function useChatMessages<Message extends ChatMessage>({
  channelName,
  enabled,
  filterColumn,
  getMessage,
  getQueryKey,
  id,
  listMessages,
  listQueryKey,
  markRead,
  sendMessage,
  table,
}: UseChatMessagesOptions<Message>) {
  const queryClient = useQueryClient()
  const [connectionStatus, setConnectionStatus] =
    useState<ChatConnectionStatus>('connecting')
  const lastReadAttemptRef = useRef<string | null>(null)
  const queryKey = useMemo(() => getQueryKey(id ?? ''), [getQueryKey, id])
  const messagesQuery = useInfiniteQuery<
    ChatMessagePage<Message>,
    Error,
    ChatMessageData<Message>,
    QueryKey,
    ChatMessageCursor | null
  >({
    enabled: enabled && id !== undefined,
    getNextPageParam: (page) => page.nextCursor ?? undefined,
    initialPageParam: null as ChatMessageCursor | null,
    queryFn: ({ pageParam }) => {
      if (!id) throw new Error('A conversation identifier is required.')
      return listMessages(id, pageParam)
    },
    queryKey,
  })
  const sendMutation = useMutation({
    mutationFn: (body: string) => {
      if (!id) throw new Error('A conversation identifier is required.')
      return sendMessage(id, body)
    },
    onSuccess: (message) => {
      queryClient.setQueryData<ChatMessageData<Message>>(queryKey, (data) =>
        appendMessage(data, message),
      )
    },
  })

  useEffect(() => {
    if (!enabled || !id) return

    let isActive = true
    const channel = supabase
      .channel(`${channelName}:${id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          filter: `${filterColumn}=eq.${id}`,
          schema: 'public',
          table,
        },
        (payload) => {
          const messageId = payload.new.id
          if (typeof messageId !== 'string') return

          void queryClient.invalidateQueries({ queryKey })
          void getMessage(messageId)
            .then((message) => {
              if (!isActive) return
              queryClient.setQueryData<ChatMessageData<Message>>(
                queryKey,
                (data) => appendMessage(data, message),
              )
            })
            .catch(() => {
              if (!isActive) return
              void queryClient.invalidateQueries({ queryKey })
            })
        },
      )
      .subscribe((status) => {
        if (!isActive) return
        if (status === 'SUBSCRIBED') {
          void queryClient.invalidateQueries({ queryKey }).finally(() => {
            if (isActive) setConnectionStatus('live')
          })
        } else if (
          status === 'CHANNEL_ERROR' ||
          status === 'TIMED_OUT' ||
          status === 'CLOSED'
        ) {
          setConnectionStatus('paused')
        } else {
          setConnectionStatus('connecting')
        }
      })

    return () => {
      isActive = false
      void supabase.removeChannel(channel)
    }
  }, [
    channelName,
    enabled,
    filterColumn,
    getMessage,
    id,
    queryClient,
    queryKey,
    table,
  ])

  const messages = useMemo(
    () =>
      [...(messagesQuery.data?.pages ?? [])]
        .reverse()
        .flatMap((page) => page.messages),
    [messagesQuery.data?.pages],
  )

  const latestMessageId = messages.at(-1)?.id

  useEffect(() => {
    lastReadAttemptRef.current = null
  }, [id])

  const markLatestRead = useCallback(() => {
    if (
      !enabled ||
      !id ||
      !latestMessageId ||
      (typeof document !== 'undefined' &&
        document.visibilityState !== 'visible')
    ) {
      return
    }
    if (lastReadAttemptRef.current === latestMessageId) return

    lastReadAttemptRef.current = latestMessageId
    void markRead(id, latestMessageId)
      .then(() => queryClient.invalidateQueries({ queryKey: listQueryKey }))
      .catch(() => {
        if (lastReadAttemptRef.current === latestMessageId) {
          lastReadAttemptRef.current = null
        }
      })
  }, [enabled, id, latestMessageId, listQueryKey, markRead, queryClient])

  useEffect(() => {
    markLatestRead()
  }, [markLatestRead])

  useEffect(() => {
    const handleVisibilityChange = () => {
      markLatestRead()
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () =>
      document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [markLatestRead])

  return {
    connectionStatus,
    error: messagesQuery.error,
    hasOlderMessages: messagesQuery.hasNextPage,
    isError: messagesQuery.isError,
    isLoading: messagesQuery.isPending,
    isLoadingOlderMessages: messagesQuery.isFetchingNextPage,
    isSending: sendMutation.isPending,
    messages,
    sendError: sendMutation.error,
    loadOlderMessages: async () => {
      await messagesQuery.fetchNextPage()
    },
    retry: () => void messagesQuery.refetch(),
    send: async (body: string) => {
      await sendMutation.mutateAsync(body)
    },
  }
}
