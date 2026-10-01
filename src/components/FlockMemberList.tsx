import type { FlockMemberSummary } from '@src/types/flockMembers'

export type FlockMemberListProps = {
  members: readonly FlockMemberSummary[]
}

function getInitial(displayName: string) {
  return displayName.trim().charAt(0).toLocaleUpperCase() || 'R'
}

function FlockMemberList({ members }: FlockMemberListProps) {
  if (members.length === 0) {
    return null
  }

  return (
    <ul
      aria-label="Flock members"
      className="m-0 list-none divide-y divide-border overflow-hidden rounded-lg border border-border bg-background p-0"
    >
      {members.map((member) => (
        <li
          className="flex min-h-16 items-center gap-3 px-4 py-3"
          key={member.userId}
        >
          <span
            aria-hidden="true"
            className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface-subtle font-display text-sm font-bold text-primary-strong"
          >
            {getInitial(member.displayName)}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-display text-base font-bold leading-6 text-text [overflow-wrap:anywhere]">
              {member.displayName}
            </span>
            {member.location ? (
              <span className="block text-sm leading-5 text-text-muted [overflow-wrap:anywhere]">
                {member.location}
              </span>
            ) : null}
          </span>
          <span className="shrink-0 rounded-full bg-surface-subtle px-2.5 py-1 text-xs font-bold text-text-muted">
            {member.role === 'owner' ? 'Owner' : 'Member'}
          </span>
        </li>
      ))}
    </ul>
  )
}

export default FlockMemberList
