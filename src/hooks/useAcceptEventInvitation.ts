import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  acceptEventInvitation,
  acceptEventInvitationById,
} from '@src/data/invitations'
import { eventQueryKeys } from '@src/data/queryKeys'

export function useAcceptEventInvitation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: acceptEventInvitation,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: eventQueryKeys.mine() }),
        queryClient.invalidateQueries({
          queryKey: eventQueryKeys.invitations(),
        }),
      ])
    },
  })
}

export function useAcceptEventInvitationById() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: acceptEventInvitationById,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: eventQueryKeys.mine() }),
        queryClient.invalidateQueries({
          queryKey: eventQueryKeys.invitations(),
        }),
      ])
    },
  })
}
