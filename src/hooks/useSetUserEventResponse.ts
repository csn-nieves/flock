import { useMutation, useQueryClient } from '@tanstack/react-query'
import { setFlockEventResponse } from '@src/data/events'
import { eventQueryKeys } from '@src/data/queryKeys'
import type { EventResponse } from '@src/types/events'

export function useSetUserEventResponse() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      eventId,
      response,
      runOptionId,
    }: {
      eventId: string
      response: EventResponse
      runOptionId: string | null
    }) => setFlockEventResponse(eventId, response, runOptionId),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: eventQueryKeys.mine() }),
  })
}
