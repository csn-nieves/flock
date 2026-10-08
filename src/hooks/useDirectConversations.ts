import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  getOrCreateDirectConversation,
  listMyDirectConversations,
} from '@src/data/directChat'
import { directChatQueryKeys } from '@src/data/queryKeys'

export function useDirectConversations() {
  return useQuery({
    queryFn: listMyDirectConversations,
    queryKey: directChatQueryKeys.lists(),
  })
}

export function useStartDirectConversation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: getOrCreateDirectConversation,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: directChatQueryKeys.lists(),
      })
    },
  })
}
