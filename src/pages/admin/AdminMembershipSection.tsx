import { useEffect, useRef, useState } from 'react'

import Modal from '@src/components/Modal'
import type { AdminMembership } from '@src/data/admin'
import Button from '@src/primitives/Button'

type AdminMembershipSectionProps = {
  currentPage: number
  isRemoving: boolean
  memberships: readonly AdminMembership[]
  onDismissRemoveError: () => void
  onPageChange: (page: number) => void
  onRemove: (membership: AdminMembership) => Promise<void>
  totalCount: number
  totalPages: number
  userNames: ReadonlyMap<string, string>
  removeError?: string
}

function AdminMembershipSection({
  currentPage,
  isRemoving,
  memberships,
  onDismissRemoveError,
  onPageChange,
  onRemove,
  removeError,
  totalCount,
  totalPages,
  userNames,
}: AdminMembershipSectionProps) {
  const [removingMembership, setRemovingMembership] =
    useState<AdminMembership | null>(null)
  const [completionMessage, setCompletionMessage] = useState<string | null>(
    null,
  )
  const headingRef = useRef<HTMLHeadingElement>(null)
  const shouldFocusHeading = useRef(false)

  useEffect(() => {
    if (!shouldFocusHeading.current) return
    headingRef.current?.focus()
    shouldFocusHeading.current = false
  })

  const closeRemoveDialog = () => {
    onDismissRemoveError()
    setRemovingMembership(null)
  }

  const removingRunnerName = removingMembership
    ? (userNames.get(removingMembership.userId) ?? 'Unknown runner')
    : ''

  return (
    <section aria-labelledby="admin-memberships-heading" className="mt-8">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2
            className="m-0 rounded-sm font-display text-xl font-bold text-text outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
            id="admin-memberships-heading"
            ref={headingRef}
            tabIndex={-1}
          >
            Memberships ({totalCount})
          </h2>
          <p className="mt-1 mb-0 text-sm text-text-muted">
            Memberships are ordered by join date, latest first.
          </p>
        </div>
        {totalPages > 1 ? (
          <p className="m-0 text-sm text-text-muted">
            Page {currentPage} of {totalPages}
          </p>
        ) : null}
      </div>

      {completionMessage ? (
        <p className="mt-3 mb-0 text-sm text-primary-strong" role="status">
          {completionMessage}
        </p>
      ) : null}

      {memberships.length === 0 ? (
        <p className="mt-3 rounded-lg border border-border bg-surface-subtle p-4 text-text-muted">
          No flock memberships have been created.
        </p>
      ) : (
        <ul className="mt-3 grid gap-3">
          {memberships.map((membership) => {
            const runnerName =
              userNames.get(membership.userId) ?? 'Unknown runner'

            return (
              <li
                className="rounded-lg border border-border bg-background p-4"
                key={`${membership.flockId}:${membership.userId}`}
              >
                <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="m-0 font-display text-base font-bold text-text">
                        {runnerName}
                      </h3>
                      <span className="rounded-full border border-border bg-surface-subtle px-2 py-0.5 text-xs font-bold text-text-muted">
                        {membership.role === 'owner' ? 'Owner' : 'Member'}
                      </span>
                    </div>
                    <p className="mt-1 mb-0 text-sm text-text-muted">
                      Flock: {membership.flockName}
                    </p>
                    <p className="mt-1 mb-0 text-sm text-text-muted">
                      Joined {formatMembershipDate(membership.joinedAt)}
                    </p>
                    {membership.role === 'owner' ? (
                      <p className="mt-2 mb-0 text-sm text-text-muted">
                        Owner memberships cannot be removed here.
                      </p>
                    ) : null}
                  </div>
                  {membership.role === 'member' ? (
                    <Button
                      className="w-full md:w-auto"
                      variant="danger"
                      onClick={() => {
                        setCompletionMessage(null)
                        onDismissRemoveError()
                        setRemovingMembership(membership)
                      }}
                    >
                      Remove member
                    </Button>
                  ) : null}
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {totalPages > 1 ? (
        <nav
          aria-label="Membership pages"
          className="mt-4 flex items-center justify-between gap-3"
        >
          <Button
            disabled={currentPage === 1}
            variant="secondary"
            onClick={() => onPageChange(currentPage - 1)}
          >
            Previous
          </Button>
          <span className="text-sm text-text-muted">
            {currentPage} of {totalPages}
          </span>
          <Button
            disabled={currentPage === totalPages}
            variant="secondary"
            onClick={() => onPageChange(currentPage + 1)}
          >
            Next
          </Button>
        </nav>
      ) : null}

      {removingMembership ? (
        <Modal
          description={`This removes “${removingRunnerName}” from “${removingMembership.flockName}”. They will lose access to the flock and its flock events. Their account and personal events stay intact.`}
          onClose={closeRemoveDialog}
          title="Remove member?"
          tone="danger"
        >
          {removeError ? (
            <p
              className="mb-4 rounded-md border border-danger bg-surface-subtle p-3 text-sm text-text"
              role="alert"
            >
              {removeError}
            </p>
          ) : null}
          <div className="grid gap-2 sm:flex sm:flex-row-reverse">
            <Button
              className="w-full sm:w-auto"
              isPending={isRemoving}
              pendingLabel="Removing member"
              variant="danger"
              onClick={async () => {
                try {
                  await onRemove(removingMembership)
                  setCompletionMessage(
                    `${removingRunnerName} was removed from ${removingMembership.flockName}.`,
                  )
                  shouldFocusHeading.current = true
                  closeRemoveDialog()
                } catch {
                  // Keep the dialog open with its route-owned recovery message.
                }
              }}
            >
              Remove member
            </Button>
            <Button
              className="w-full sm:w-auto"
              variant="secondary"
              onClick={closeRemoveDialog}
            >
              Keep member
            </Button>
          </div>
        </Modal>
      ) : null}
    </section>
  )
}

function formatMembershipDate(joinedAt: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
  }).format(new Date(joinedAt))
}

export default AdminMembershipSection
