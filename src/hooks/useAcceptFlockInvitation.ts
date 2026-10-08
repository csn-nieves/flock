import { useMutation, useQueryClient } from '@tanstack/react-query'

import { acceptFlockInvitation } from '@src/data/invitations'
import { flockChatQueryKeys, flockQueryKeys } from '@src/data/queryKeys'

export function useAcceptFlockInvitation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: acceptFlockInvitation,
    onSuccess: async (flock) => {
      queryClient.setQueryData(flockQueryKeys.detail(flock.id), flock)
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: flockQueryKeys.detail(flock.id),
        }),
        queryClient.invalidateQueries({
          queryKey: flockQueryKeys.lists(),
        }),
        queryClient.invalidateQueries({
          queryKey: flockChatQueryKeys.lists(),
        }),
      ])
    },
  })
}
