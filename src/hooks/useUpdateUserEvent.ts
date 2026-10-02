import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateFlockEvent } from '@src/data/events'
import { eventQueryKeys } from '@src/data/queryKeys'

export function useUpdateUserEvent() {
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
      queryClient.invalidateQueries({ queryKey: eventQueryKeys.mine() }),
  })
}
