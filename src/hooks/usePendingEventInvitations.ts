import { useQuery } from '@tanstack/react-query'
import { listPendingEventInvitations } from '@src/data/invitations'
import { eventQueryKeys } from '@src/data/queryKeys'

export function usePendingEventInvitations() {
  return useQuery({
    queryFn: listPendingEventInvitations,
    queryKey: eventQueryKeys.invitations(),
  })
}
