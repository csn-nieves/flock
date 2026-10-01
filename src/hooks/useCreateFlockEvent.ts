import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createFlockEvent } from '@src/data/events'
import { eventQueryKeys } from '@src/data/queryKeys'

export function useCreateFlockEvent(flockId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: Parameters<typeof createFlockEvent>[1]) =>
      createFlockEvent(flockId, input),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: eventQueryKeys.flock(flockId),
      }),
  })
}
