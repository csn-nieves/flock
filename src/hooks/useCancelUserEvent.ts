import { useMutation, useQueryClient } from '@tanstack/react-query'
import { cancelFlockEvent } from '@src/data/events'
import { eventQueryKeys } from '@src/data/queryKeys'

export function useCancelUserEvent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: cancelFlockEvent,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: eventQueryKeys.mine() }),
  })
}
