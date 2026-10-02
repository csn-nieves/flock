import { useMutation } from '@tanstack/react-query'
import {
  createEventInvitation,
  createFlockEventInvitation,
  createTargetedEventInvitation,
} from '@src/data/invitations'

export function useCreateEventInvitation() {
  return useMutation({ mutationFn: createEventInvitation })
}

export function useCreateTargetedEventInvitation() {
  return useMutation({
    mutationFn: ({
      eventId,
      recipientUserId,
    }: {
      eventId: string
      recipientUserId: string
    }) => createTargetedEventInvitation(eventId, recipientUserId),
  })
}

export function useCreateFlockEventInvitation() {
  return useMutation({
    mutationFn: ({ eventId, flockId }: { eventId: string; flockId: string }) =>
      createFlockEventInvitation(eventId, flockId),
  })
}
