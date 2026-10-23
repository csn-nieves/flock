import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createEventSeries } from '@src/data/events'
import { eventQueryKeys } from '@src/data/queryKeys'
import type {
  EventRecurrenceInput,
  EventWithRunOptionsInput,
} from '@src/types/events'

type CreateEventSeriesInput = {
  input: EventWithRunOptionsInput
  recurrence: EventRecurrenceInput
}

export function useCreateEventSeries(flockId: string | null) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ input, recurrence }: CreateEventSeriesInput) =>
      createEventSeries(flockId, input, recurrence),
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
