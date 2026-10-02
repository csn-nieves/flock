import { useMutation } from '@tanstack/react-query'
import { createEventInvitation, createTargetedEventInvitation } from '@src/data/invitations'

export function useCreateEventInvitation() {
  return useMutation({ mutationFn: createEventInvitation })
}

export function useCreateTargetedEventInvitation() {
  return useMutation({
    mutationFn: ({ eventId, recipientUserId }: { eventId: string; recipientUserId: string }) =>
      createTargetedEventInvitation(eventId, recipientUserId),
  })
}
