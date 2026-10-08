import { useEffect, useMemo, useState } from 'react'
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
  type InfiniteData,
} from '@tanstack/react-query'

import {
  getFlockMessage,
  listFlockMessages,
  sendFlockMessage,
} from '@src/data/flockChat'
import { flockChatQueryKeys } from '@src/data/queryKeys'
import { supabase } from '@src/data/supabase'
import type {
  FlockChatConnectionStatus,
  FlockMessage,
  FlockMessageCursor,
  FlockMessagePage,
} from '@src/types/chat'

type FlockMessageData = InfiniteData<
  FlockMessagePage,
  FlockMessageCursor | null
>

function appendMessage(
  data: FlockMessageData | undefined,
  message: FlockMessage,
): FlockMessageData | undefined {
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

export function useFlockChat(flockId: string | undefined, enabled: boolean) {
  const queryClient = useQueryClient()
  const [connectionStatus, setConnectionStatus] =
    useState<FlockChatConnectionStatus>('connecting')
  const queryKey = useMemo(
    () => flockChatQueryKeys.messages(flockId ?? ''),
    [flockId],
  )
  const messagesQuery = useInfiniteQuery<
    FlockMessagePage,
    Error,
    FlockMessageData,
    ReturnType<typeof flockChatQueryKeys.messages>,
    FlockMessageCursor | null
  >({
    enabled: enabled && flockId !== undefined,
    getNextPageParam: (page) => page.nextCursor ?? undefined,
    initialPageParam: null as FlockMessageCursor | null,
    queryFn: ({ pageParam }) => {
      if (!flockId) throw new Error('A flock identifier is required.')
      return listFlockMessages(flockId, pageParam)
    },
    queryKey,
  })
  const sendMutation = useMutation({
    mutationFn: (body: string) => {
      if (!flockId) throw new Error('A flock identifier is required.')
      return sendFlockMessage(flockId, body)
    },
    onSuccess: (message) => {
      queryClient.setQueryData<FlockMessageData>(queryKey, (data) =>
        appendMessage(data, message),
      )
    },
  })

  useEffect(() => {
    if (!enabled || !flockId) return

    let isActive = true
    const channel = supabase
      .channel(`flock-chat:${flockId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          filter: `flock_id=eq.${flockId}`,
          schema: 'public',
          table: 'flock_messages',
        },
        (payload) => {
          const messageId = payload.new.id
          if (typeof messageId !== 'string') return

          void queryClient.invalidateQueries({ queryKey })
          void getFlockMessage(messageId)
            .then((message) => {
              if (!isActive) return
              queryClient.setQueryData<FlockMessageData>(queryKey, (data) =>
                appendMessage(data, message),
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
  }, [enabled, flockId, queryClient, queryKey])

  const messages = useMemo(
    () =>
      [...(messagesQuery.data?.pages ?? [])]
        .reverse()
        .flatMap((page) => page.messages),
    [messagesQuery.data?.pages],
  )

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
