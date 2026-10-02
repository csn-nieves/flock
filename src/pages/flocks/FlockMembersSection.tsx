import { useState, type ReactNode } from 'react'

import FlockMemberList from '@src/components/FlockMemberList'
import Button from '@src/primitives/Button'
import PendingIndicator from '@src/primitives/PendingIndicator'
import type { FlockMemberSummary } from '@src/types/flockMembers'

export type FlockMemberListState =
  | {
      status: 'loading'
    }
  | {
      isRetrying: boolean
      status: 'error'
    }
  | {
      hasRefreshError: boolean
      isRefreshing: boolean
      isRetrying: boolean
      members: readonly FlockMemberSummary[]
      status: 'ready'
    }

type FlockMembersSectionProps = {
  memberList: FlockMemberListState
  onRetry: () => void
}

function FlockMembersSection({
  memberList,
  onRetry,
}: FlockMembersSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  let content: ReactNode
  let memberCount: ReactNode = null
  let memberPreview: ReactNode = null

  if (memberList.status === 'loading') {
    content = (
      <div
        className="flex min-h-32 items-center justify-center gap-3 rounded-lg border border-border bg-surface-subtle px-4 py-8 text-text-muted"
        role="status"
      >
        <PendingIndicator />
        <span>Loading members…</span>
      </div>
    )
  } else if (memberList.status === 'error') {
    content = (
      <div
        className="rounded-lg border border-accent bg-surface-subtle px-4 py-5"
        role="alert"
      >
        <p className="mt-0 mb-4 leading-6 text-text">
          We could not load the member list. Check your connection and try
          again.
        </p>
        <Button
          isPending={memberList.isRetrying}
          pendingLabel="Trying again"
          variant="secondary"
          onClick={onRetry}
        >
          Try again
        </Button>
      </div>
    )
  } else {
    memberCount = (
      <span className="text-sm font-semibold text-text-muted">
        {memberList.members.length}
      </span>
    )
    memberPreview = (
      <div aria-hidden="true" className="flex -space-x-2">
        {memberList.members.slice(0, 5).map((member) => (
          <span
            className="flex size-8 items-center justify-center rounded-full border-2 border-background bg-surface-subtle font-display text-xs font-bold text-primary-strong"
            key={member.userId}
          >
            {member.displayName.trim().charAt(0).toLocaleUpperCase() || 'R'}
          </span>
        ))}
      </div>
    )

    if (memberList.members.length === 0) {
      content = (
        <p className="m-0 rounded-lg border border-border bg-surface-subtle px-4 py-5 leading-6 text-text-muted">
          No members are visible yet.
        </p>
      )
    } else {
      content = <FlockMemberList members={memberList.members} />
    }

    if (memberList.hasRefreshError) {
      content = (
        <>
          <div
            className="mb-3 rounded-lg border border-accent bg-surface-subtle px-4 py-4"
            role="alert"
          >
            <p className="mt-0 mb-3 leading-6 text-text">
              The member list may be out of date.
            </p>
            <Button
              isPending={memberList.isRetrying}
              pendingLabel="Refreshing members"
              variant="secondary"
              onClick={onRetry}
            >
              Refresh members
            </Button>
          </div>
          {content}
        </>
      )
    } else if (memberList.isRefreshing) {
      content = (
        <>
          <p className="sr-only" role="status">
            Refreshing members…
          </p>
          {content}
        </>
      )
    }
  }

  return (
    <section aria-labelledby="flock-members-heading" className="mt-10">
      <div className="mb-3 flex items-center justify-between gap-4">
        {memberList.status === 'ready' ? (
          <>
            <div className="flex min-w-0 items-center gap-3">
              <h2
                className="m-0 font-display text-xl font-bold tracking-[-0.02em] text-text"
                id="flock-members-heading"
              >
                Members
              </h2>
              {memberCount}
              {memberPreview}
            </div>
            <button
              aria-controls="flock-member-roster"
              aria-expanded={isExpanded}
              className="ml-auto min-h-touch shrink-0 rounded-md px-2 text-sm font-semibold text-text underline decoration-border underline-offset-4 hover:bg-surface-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
              onClick={() => setIsExpanded((expanded) => !expanded)}
              type="button"
            >
              {isExpanded ? 'Hide' : 'Show'}
            </button>
          </>
        ) : (
          <h2
            className="m-0 font-display text-xl font-bold tracking-[-0.02em] text-text"
            id="flock-members-heading"
          >
            Members
          </h2>
        )}
      </div>
      {memberList.status === 'ready' &&
      !isExpanded &&
      memberList.members.length > 0 &&
      !memberList.isRefreshing &&
      !memberList.hasRefreshError ? (
        <div aria-hidden="true" />
      ) : (
        <div id="flock-member-roster">{content}</div>
      )}
    </section>
  )
}

export default FlockMembersSection
