import type {
  FlockMemberRole,
  FlockMemberSummary,
} from '@src/types/flockMembers'

type MemberRoleGroupProps = {
  isCollapsed: boolean
  members: readonly FlockMemberSummary[]
  onToggle: () => void
  role: FlockMemberRole
}

function MemberRoleGroup({
  isCollapsed,
  members,
  onToggle,
  role,
}: MemberRoleGroupProps) {
  const label = role === 'owner' ? 'Owners' : 'Members'
  return (
    <section>
      <button
        aria-expanded={!isCollapsed}
        className="flex min-h-touch w-full items-center justify-between rounded-md px-2 text-left font-semibold text-text hover:bg-surface-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        onClick={onToggle}
        type="button"
      >
        <span>
          {label} ({members.length})
        </span>
        <span
          aria-hidden="true"
          className={`inline-block size-2.5 border-r-2 border-b-2 border-text transition-transform ${isCollapsed ? 'rotate-45 -translate-y-0.5' : '-rotate-[135deg] translate-y-0.5'}`}
        />
      </button>
      {!isCollapsed ? (
        <ul className="m-0 list-none divide-y divide-border overflow-hidden rounded-lg border border-border bg-background p-0">
          {members.map((member) => (
            <li
              className="flex min-h-16 items-center gap-3 px-4 py-3"
              key={member.userId}
            >
              <span
                aria-hidden="true"
                className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface-subtle font-display text-sm font-bold text-primary-strong"
              >
                {member.displayName.trim().charAt(0).toLocaleUpperCase() || 'R'}
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
                {role === 'owner' ? 'Owner' : 'Member'}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  )
}

export default MemberRoleGroup
