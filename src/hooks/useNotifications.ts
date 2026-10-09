import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { QueryClient } from '@tanstack/react-query'
import type { RealtimeChannel } from '@supabase/supabase-js'

import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '@src/data/notifications'
import { notificationQueryKeys } from '@src/data/queryKeys'
import { supabase } from '@src/data/supabase'
import { useAuthSession } from './useAuthSession'

const notificationQueryClients = new Map<QueryClient, number>()
let notificationChannel: RealtimeChannel | null = null

function addNotificationRealtimeClient(
  queryClient: QueryClient,
  userId: string,
) {
  notificationQueryClients.set(
    queryClient,
    (notificationQueryClients.get(queryClient) ?? 0) + 1,
  )

  if (!notificationChannel) {
    notificationChannel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          filter: `user_id=eq.${userId}`,
          schema: 'public',
          table: 'notifications',
        },
        () => {
          for (const client of notificationQueryClients.keys()) {
            void client.invalidateQueries({
              queryKey: notificationQueryKeys.list(),
            })
          }
        },
      )
      .subscribe()
  }
}

function removeNotificationRealtimeClient(queryClient: QueryClient) {
  const currentCount = notificationQueryClients.get(queryClient) ?? 0
  if (currentCount <= 1) notificationQueryClients.delete(queryClient)
  else notificationQueryClients.set(queryClient, currentCount - 1)
  if (notificationQueryClients.size > 0 || !notificationChannel) return

  const channel = notificationChannel
  notificationChannel = null
  void supabase.removeChannel(channel)
}

export function useNotifications() {
  const { session } = useAuthSession()
  const queryClient = useQueryClient()
  const query = useQuery({
    enabled: Boolean(session?.user.id),
    queryFn: listNotifications,
    queryKey: notificationQueryKeys.list(),
  })

  useEffect(() => {
    const userId = session?.user.id
    if (!userId || import.meta.env.MODE === 'test') return

    addNotificationRealtimeClient(queryClient, userId)

    return () => removeNotificationRealtimeClient(queryClient)
  }, [queryClient, session?.user.id])

  return query
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: notificationQueryKeys.list() }),
  })
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: notificationQueryKeys.list() }),
  })
}
