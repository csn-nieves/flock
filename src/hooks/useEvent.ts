import { useQuery } from '@tanstack/react-query'
import { getEvent } from '@src/data/events'
import { eventQueryKeys } from '@src/data/queryKeys'

export function useEvent(eventId: string | undefined) {
  return useQuery({
    enabled: Boolean(eventId),
    queryFn: () => getEvent(eventId as string),
    queryKey: eventQueryKeys.detail(eventId ?? ''),
  })
}
