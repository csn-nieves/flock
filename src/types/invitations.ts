export type FlockInvitation = {
  expiresAt: string
  token: string
}

export type FlockInvitationLink = FlockInvitation & {
  url: string
}
