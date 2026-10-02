export type FlockInvitation = {
  expiresAt: string
  token: string
}

export type FlockInvitationLink = FlockInvitation & {
  url: string
}

export type EventRecipientInvitation = FlockInvitation & {
  recipientDisplayName: string
  recipientUserId: string
}

export type EventRecipientInvitationLink = EventRecipientInvitation & {
  url: string
}
