import { useMutation, useQueryClient } from '@tanstack/react-query'
import { cancelFlockEvent } from '@src/data/events'
import { eventQueryKeys } from '@src/data/queryKeys'

export function useCancelFlockEvent(flockId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: cancelFlockEvent,
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: eventQueryKeys.flock(flockId),
      }),
  })
}
