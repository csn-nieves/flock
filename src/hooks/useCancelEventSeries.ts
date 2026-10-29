import { useMutation, useQueryClient } from '@tanstack/react-query'
import { cancelEventSeries } from '@src/data/events'
import { eventQueryKeys } from '@src/data/queryKeys'

export function useCancelEventSeries(flockId: string | null) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: cancelEventSeries,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: eventQueryKeys.mine() })
      if (flockId) {
        void queryClient.invalidateQueries({
          queryKey: eventQueryKeys.flock(flockId),
        })
      }
    },
  })
}
