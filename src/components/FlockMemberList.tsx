import { useMemo, useState } from 'react'
import TextField from '@src/primitives/TextField'
import type {
  FlockMemberRole,
  FlockMemberSummary,
} from '@src/types/flockMembers'

export type FlockMemberListProps = {
  members: readonly FlockMemberSummary[]
}

function getInitial(displayName: string) {
  return displayName.trim().charAt(0).toLocaleUpperCase() || 'R'
}

function FlockMemberList({ members }: FlockMemberListProps) {
  const [query, setQuery] = useState('')
  const [collapsedRoles, setCollapsedRoles] = useState<Set<FlockMemberRole>>(
    () => new Set(),
  )

  const filteredMembers = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase()
    if (!normalizedQuery) return members
    return members.filter((member) =>
      `${member.displayName} ${member.location ?? ''}`
        .toLocaleLowerCase()
        .includes(normalizedQuery),
    )
  }, [members, query])

  const groups: Array<{ label: string; role: FlockMemberRole }> = [
    { label: 'Owners', role: 'owner' },
    { label: 'Members', role: 'member' },
  ]

  if (members.length === 0) {
    return null
  }

  return (
    <div>
      <TextField
        label="Search members"
        name="memberSearch"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      {filteredMembers.length === 0 ? (
        <p className="mt-3 rounded-lg border border-border bg-surface-subtle px-4 py-5 text-text-muted">
          No members match that search.
        </p>
      ) : (
        <div aria-label="Flock members" className="mt-3 space-y-3" role="list">
          {groups.map(({ label, role }) => {
            const groupMembers = filteredMembers.filter(
              (member) => member.role === role,
            )
            if (groupMembers.length === 0) return null
            const isCollapsed = collapsedRoles.has(role)
            return (
              <section key={role}>
                <button
                  aria-expanded={!isCollapsed}
                  className="flex min-h-touch w-full items-center justify-between rounded-md px-2 text-left font-semibold text-text hover:bg-surface-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                  onClick={() =>
                    setCollapsedRoles((current) => {
                      const next = new Set(current)
                      if (next.has(role)) next.delete(role)
                      else next.add(role)
                      return next
                    })
                  }
                  type="button"
                >
                  <span>
                    {label} ({groupMembers.length})
                  </span>
                  <span
                    aria-hidden="true"
                    className={`inline-block size-2.5 border-r-2 border-b-2 border-text transition-transform ${isCollapsed ? 'rotate-45 -translate-y-0.5' : '-rotate-[135deg] translate-y-0.5'}`}
                  />
                </button>
                {!isCollapsed ? (
                  <ul className="m-0 list-none divide-y divide-border overflow-hidden rounded-lg border border-border bg-background p-0">
                    {groupMembers.map((member) => (
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
                ) : null}
              </section>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default FlockMemberList
