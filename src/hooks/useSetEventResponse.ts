import { useMutation, useQueryClient } from '@tanstack/react-query'
import { setFlockEventResponse } from '@src/data/events'
import { eventQueryKeys } from '@src/data/queryKeys'
import type { EventResponse } from '@src/types/events'

export function useSetEventResponse() {
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
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: eventQueryKeys.detail(variables.eventId),
      })
      void queryClient.invalidateQueries({ queryKey: eventQueryKeys.mine() })
      void queryClient.invalidateQueries({ queryKey: eventQueryKeys.all })
    },
  })
}
