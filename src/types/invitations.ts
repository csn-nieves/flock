export type FlockInvitation = {
  expiresAt: string
  token: string
}

export type FlockInvitationLink = FlockInvitation & {
  url: string
}

export type EventAudienceInvitationLink = FlockInvitation & {
  audienceName: string
  audienceType: 'flock' | 'runner'
  url: string
}

export type PendingEventInvitation = {
  audienceName: string | null
  audienceType: 'flock' | 'runner'
  eventDescription: string
  eventId: string
  eventLocation: string
  eventStartsAt: string
  eventTitle: string
  expiresAt: string
  invitationId: string
}
