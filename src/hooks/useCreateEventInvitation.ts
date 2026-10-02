import { useMutation } from '@tanstack/react-query'
import { createEventInvitation } from '@src/data/invitations'

export function useCreateEventInvitation() {
  return useMutation({ mutationFn: createEventInvitation })
}
