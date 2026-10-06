import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateUserEvent } from '@src/data/events'
import { eventQueryKeys } from '@src/data/queryKeys'

export function useUpdateUserEvent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      eventId,
      input,
    }: {
      eventId: string
      input: Parameters<typeof updateUserEvent>[1]
    }) => updateUserEvent(eventId, input),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: eventQueryKeys.mine() }),
  })
}
