export type FlockMemberRole = 'owner' | 'member'

export type FlockMemberSummary = {
  displayName: string
  location: string | null
  joinedAt: string
  role: FlockMemberRole
  userId: string
}
