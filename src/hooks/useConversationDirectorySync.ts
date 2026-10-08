import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'

import { directChatQueryKeys, flockChatQueryKeys } from '@src/data/queryKeys'
import { supabase } from '@src/data/supabase'

export function useConversationDirectorySync(userId: string | undefined) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!userId || import.meta.env.MODE === 'test') return

    const refreshFlockChats = () =>
      queryClient.invalidateQueries({ queryKey: flockChatQueryKeys.lists() })
    const refreshDirectChats = () =>
      queryClient.invalidateQueries({ queryKey: directChatQueryKeys.lists() })
    const channel = supabase
      .channel(`conversation-directory:${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'flock_messages' },
        refreshFlockChats,
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'direct_messages' },
        refreshDirectChats,
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          filter: `user_id=eq.${userId}`,
          schema: 'public',
          table: 'flock_chat_reads',
        },
        refreshFlockChats,
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          filter: `user_id=eq.${userId}`,
          schema: 'public',
          table: 'direct_conversation_reads',
        },
        refreshDirectChats,
      )
      .subscribe((status) => {
        if (status !== 'SUBSCRIBED') return
        void refreshFlockChats()
        void refreshDirectChats()
      })

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [queryClient, userId])
}
