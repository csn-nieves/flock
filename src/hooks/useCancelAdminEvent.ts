import { useMutation, useQueryClient } from '@tanstack/react-query'

import { cancelAdminEvent } from '@src/data/admin'
import { eventQueryKeys } from '@src/data/queryKeys'

export function useCancelAdminEvent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: cancelAdminEvent,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['admin', 'events'] }),
        queryClient.invalidateQueries({ queryKey: eventQueryKeys.mine() }),
      ])
    },
  })
}
