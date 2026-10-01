import type { FlockMemberSummary } from '@src/types/flockMembers'
import FlockMemberList from './FlockMemberList'

const members: FlockMemberSummary[] = [
  {
    displayName: 'Local Organizer',
    joinedAt: '2026-01-01T12:00:00.000Z',
    role: 'owner',
    userId: 'owner-id',
  },
  {
    displayName: 'Local Runner',
    joinedAt: '2026-01-02T12:00:00.000Z',
    role: 'member',
    userId: 'runner-id',
  },
]

export function Loaded() {
  return <FlockMemberList members={members} />
}

export function LongName() {
  return (
    <FlockMemberList
      members={[
        {
          displayName:
            'Alexandria Montgomery-Rutherford Who Runs Every Riverside Trail',
          joinedAt: '2026-01-02T12:00:00.000Z',
          role: 'member',
          userId: 'long-name-id',
        },
      ]}
    />
  )
}

export function Empty() {
  return <FlockMemberList members={[]} />
}
