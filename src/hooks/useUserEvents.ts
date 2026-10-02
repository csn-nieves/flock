import { useQuery } from '@tanstack/react-query'
import { listUserEvents } from '@src/data/events'
import { eventQueryKeys } from '@src/data/queryKeys'

export function useUserEvents() {
  return useQuery({
    queryFn: listUserEvents,
    queryKey: eventQueryKeys.mine(),
  })
}
