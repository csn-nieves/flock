import { useMemo, useState } from 'react'
import MemberRoleGroup from '@src/components/MemberRoleGroup'
import TextField from '@src/primitives/TextField'
import type {
  FlockMemberRole,
  FlockMemberSummary,
} from '@src/types/flockMembers'

export type FlockMemberListProps = { members: readonly FlockMemberSummary[] }

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
  if (members.length === 0) return null
  const groups: FlockMemberRole[] = ['owner', 'member']
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
          {groups.map((role) => {
            const groupMembers = filteredMembers.filter(
              (member) => member.role === role,
            )
            if (groupMembers.length === 0) return null
            return (
              <MemberRoleGroup
                isCollapsed={collapsedRoles.has(role)}
                key={role}
                members={groupMembers}
                onToggle={() =>
                  setCollapsedRoles((current) => {
                    const next = new Set(current)
                    if (next.has(role)) next.delete(role)
                    else next.add(role)
                    return next
                  })
                }
                role={role}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}

export default FlockMemberList
