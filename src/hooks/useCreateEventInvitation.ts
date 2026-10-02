import { useMutation } from '@tanstack/react-query'
import {
  createEventInvitation,
  createFlockEventInvitations,
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

export function useCreateFlockEventInvitations() {
  return useMutation({
    mutationFn: ({ eventId, flockId }: { eventId: string; flockId: string }) =>
      createFlockEventInvitations(eventId, flockId),
  })
}
