import { useMutation } from '@tanstack/react-query'
import { acceptEventInvitation } from '@src/data/invitations'

export function useAcceptEventInvitation() {
  return useMutation({ mutationFn: acceptEventInvitation })
}
