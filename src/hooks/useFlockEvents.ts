import { useQuery } from '@tanstack/react-query'
import { listFlockEvents } from '@src/data/events'
import { eventQueryKeys } from '@src/data/queryKeys'

export function useFlockEvents(flockId: string | undefined) {
  return useQuery({
    enabled: Boolean(flockId),
    queryFn: () => listFlockEvents(flockId as string),
    queryKey: eventQueryKeys.flock(flockId ?? ''),
  })
}
