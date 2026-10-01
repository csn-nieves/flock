import { useMutation, useQueryClient } from '@tanstack/react-query'
import { eventQueryKeys } from '@src/data/queryKeys'
import { updateFlockEvent } from '@src/data/events'

export function useUpdateFlockEvent(flockId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      eventId,
      input,
    }: {
      eventId: string
      input: Parameters<typeof updateFlockEvent>[1]
    }) => updateFlockEvent(eventId, input),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: eventQueryKeys.flock(flockId),
      }),
  })
}
