import { useMutation, useQueryClient } from '@tanstack/react-query'

import { removeAdminMembership } from '@src/data/admin'
import { flockQueryKeys } from '@src/data/queryKeys'

export function useRemoveAdminMembership() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: removeAdminMembership,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ['admin', 'memberships'],
        }),
        queryClient.invalidateQueries({
          queryKey: flockQueryKeys.memberLists(),
        }),
      ])
    },
  })
}
