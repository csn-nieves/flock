export type FlockMemberRole = 'owner' | 'member'

export type FlockMemberSummary = {
  displayName: string
  joinedAt: string
  role: FlockMemberRole
  userId: string
}
