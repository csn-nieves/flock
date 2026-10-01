import { useMutation, useQueryClient } from '@tanstack/react-query'

import { acceptFlockInvitation } from '@src/data/invitations'
import { flockQueryKeys } from '@src/data/queryKeys'

export function useAcceptFlockInvitation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: acceptFlockInvitation,
    onSuccess: (flock) => {
      queryClient.setQueryData(flockQueryKeys.detail(flock.id), flock)
      void queryClient.invalidateQueries({
        queryKey: flockQueryKeys.lists(),
      })
    },
  })
}
