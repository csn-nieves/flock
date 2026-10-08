import { useQuery } from '@tanstack/react-query'

import { listMyFlockChats } from '@src/data/flockChat'
import { flockChatQueryKeys } from '@src/data/queryKeys'

export function useFlockChats() {
  return useQuery({
    queryFn: listMyFlockChats,
    queryKey: flockChatQueryKeys.lists(),
  })
}
