import type { FlockMemberSummary } from '@src/types/flockMembers'

type MemberRosterHeaderProps = {
  isExpanded: boolean
  members: readonly FlockMemberSummary[]
  onToggle: () => void
}

function MemberRosterHeader({
  isExpanded,
  members,
  onToggle,
}: MemberRosterHeaderProps) {
  return (
    <div className="mb-3 flex items-center justify-between gap-4">
      <div className="flex min-w-0 items-center gap-3">
        <h2
          className="m-0 font-display text-xl font-bold tracking-[-0.02em] text-text"
          id="flock-members-heading"
        >
          Members
        </h2>
        <span className="text-sm font-semibold text-text-muted">
          {members.length}
        </span>
        <div aria-hidden="true" className="flex -space-x-2">
          {members.slice(0, 5).map((member) => (
            <span
              className="flex size-8 items-center justify-center rounded-full border-2 border-background bg-surface-subtle font-display text-xs font-bold text-primary-strong"
              key={member.userId}
            >
              {member.displayName.trim().charAt(0).toLocaleUpperCase() || 'R'}
            </span>
          ))}
        </div>
      </div>
      <button
        aria-controls="flock-member-roster"
        aria-expanded={isExpanded}
        className="ml-auto min-h-touch shrink-0 rounded-md px-2 text-sm font-semibold text-text underline decoration-border underline-offset-4 hover:bg-surface-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        onClick={onToggle}
        type="button"
      >
        {isExpanded ? 'Hide' : 'Show'}
      </button>
    </div>
  )
}

export default MemberRosterHeader
