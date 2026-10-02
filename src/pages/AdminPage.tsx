import { useMemo, useState } from 'react'

import Modal from '@src/components/Modal'
import type { AdminEvent, AdminFlock, AdminUser } from '@src/data/admin'
import Button from '@src/primitives/Button'

type AdminPageProps = {
  currentEventPage: number
  events: readonly AdminEvent[]
  flocks: readonly AdminFlock[]
  isCancelingEvent: boolean
  isDeleting: boolean
  onCancelEvent: (eventId: string) => Promise<void>
  onDeleteFlock: (flockId: string) => Promise<void>
  onDismissCancelEventError: () => void
  onEventPageChange: (page: number) => void
  totalEventCount: number
  totalEventPages: number
  users: readonly AdminUser[]
  cancelEventError?: string
}

export function AdminLoadingPage() {
  return (
    <p className="mx-auto max-w-4xl py-12 text-text-muted" role="status">
      Loading admin data…
    </p>
  )
}

export function AdminErrorPage({
  isRetrying,
  onRetry,
}: {
  isRetrying: boolean
  onRetry: () => void
}) {
  return (
    <section
      aria-labelledby="admin-error-heading"
      className="mx-auto max-w-4xl py-12 text-text"
    >
      <h1
        className="m-0 font-display text-2xl font-bold"
        id="admin-error-heading"
      >
        Admin data unavailable
      </h1>
      <p className="mt-2 text-text-muted" role="alert">
        We could not load admin data. Check your connection and try again.
      </p>
      <Button
        className="mt-4"
        isPending={isRetrying}
        pendingLabel="Trying again"
        variant="secondary"
        onClick={onRetry}
      >
        Try again
      </Button>
    </section>
  )
}

function AdminPage({
  cancelEventError,
  currentEventPage,
  events,
  flocks,
  isCancelingEvent,
  isDeleting,
  onCancelEvent,
  onDeleteFlock,
  onDismissCancelEventError,
  onEventPageChange,
  totalEventCount,
  totalEventPages,
  users,
}: AdminPageProps) {
  const [cancelingEvent, setCancelingEvent] = useState<AdminEvent | null>(null)
  const [deletingFlock, setDeletingFlock] = useState<AdminFlock | null>(null)
  const userNames = useMemo(
    () => new Map(users.map((user) => [user.user_id, user.display_name])),
    [users],
  )

  const closeCancelDialog = () => {
    onDismissCancelEventError()
    setCancelingEvent(null)
  }

  return (
    <section
      aria-labelledby="admin-heading"
      className="mx-auto w-full max-w-4xl py-8 sm:py-12"
    >
      <h1
        className="m-0 font-display text-3xl font-bold text-text"
        id="admin-heading"
      >
        Admin
      </h1>
      <p className="mt-2 text-text-muted">
        Global event, flock, and runner management.
      </p>

      <section aria-labelledby="admin-events-heading" className="mt-8">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2
              className="m-0 font-display text-xl font-bold text-text"
              id="admin-events-heading"
            >
              Events ({totalEventCount})
            </h2>
            <p className="mt-1 mb-0 text-sm text-text-muted">
              Events are ordered by date, latest first.
            </p>
          </div>
          {totalEventPages > 1 ? (
            <p className="m-0 text-sm text-text-muted">
              Page {currentEventPage} of {totalEventPages}
            </p>
          ) : null}
        </div>

        {events.length === 0 ? (
          <p className="mt-3 rounded-lg border border-border bg-surface-subtle p-4 text-text-muted">
            No events have been created.
          </p>
        ) : (
          <ul className="mt-3 grid gap-3">
            {events.map((event) => {
              const status = getEventStatus(event)
              const creatorName =
                userNames.get(event.createdBy) ?? 'Unknown runner'

              return (
                <li
                  className="rounded-lg border border-border bg-background p-4"
                  key={event.id}
                >
                  <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="m-0 font-display text-base font-bold text-text">
                          {event.title}
                        </h3>
                        <span
                          className={`rounded-full border px-2 py-0.5 text-xs font-bold ${getStatusClasses(status)}`}
                        >
                          {status}
                        </span>
                      </div>
                      <p className="mt-1 mb-0 text-sm text-text-muted">
                        {formatEventDate(event.startsAt)} · {event.location}
                      </p>
                      <p className="mt-2 mb-0 text-sm text-text-muted">
                        {event.flockName
                          ? `Flock event · ${event.flockName}`
                          : 'Personal event'}{' '}
                        · Created by {creatorName}
                      </p>
                    </div>
                    {status === 'Upcoming' ? (
                      <Button
                        className="w-full md:w-auto"
                        variant="danger"
                        onClick={() => {
                          onDismissCancelEventError()
                          setCancelingEvent(event)
                        }}
                      >
                        Cancel event
                      </Button>
                    ) : null}
                  </div>
                </li>
              )
            })}
          </ul>
        )}

        {totalEventPages > 1 ? (
          <nav
            aria-label="Event pages"
            className="mt-4 flex items-center justify-between gap-3"
          >
            <Button
              disabled={currentEventPage === 1}
              variant="secondary"
              onClick={() => onEventPageChange(currentEventPage - 1)}
            >
              Previous
            </Button>
            <span className="text-sm text-text-muted">
              {currentEventPage} of {totalEventPages}
            </span>
            <Button
              disabled={currentEventPage === totalEventPages}
              variant="secondary"
              onClick={() => onEventPageChange(currentEventPage + 1)}
            >
              Next
            </Button>
          </nav>
        ) : null}
      </section>

      <section aria-labelledby="admin-flocks-heading" className="mt-8">
        <h2
          className="font-display text-xl font-bold text-text"
          id="admin-flocks-heading"
        >
          Flocks ({flocks.length})
        </h2>
        <ul className="mt-3 grid gap-3">
          {flocks.map((flock) => (
            <li
              className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background p-4"
              key={flock.id}
            >
              <div>
                <h3 className="m-0 font-display font-bold text-text">
                  {flock.name}
                </h3>
                <p className="mt-1 mb-0 text-sm text-text-muted">
                  Owner: {userNames.get(flock.owner_id) ?? flock.owner_id}
                </p>
              </div>
              <Button variant="danger" onClick={() => setDeletingFlock(flock)}>
                Delete
              </Button>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="admin-users-heading" className="mt-8">
        <h2
          className="font-display text-xl font-bold text-text"
          id="admin-users-heading"
        >
          Runners ({users.length})
        </h2>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {users.map((user) => (
            <li
              className="rounded-md border border-border bg-surface-subtle px-4 py-3 text-text"
              key={user.user_id}
            >
              {user.display_name}
            </li>
          ))}
        </ul>
      </section>

      {cancelingEvent ? (
        <Modal
          description={`This removes “${cancelingEvent.title}” from upcoming event views while preserving its record and attendance history.`}
          onClose={closeCancelDialog}
          title="Cancel event?"
          tone="danger"
        >
          {cancelEventError ? (
            <p
              className="mb-4 rounded-md border border-danger bg-surface-subtle p-3 text-sm text-text"
              role="alert"
            >
              {cancelEventError}
            </p>
          ) : null}
          <div className="grid gap-2 sm:flex sm:flex-row-reverse">
            <Button
              className="w-full sm:w-auto"
              isPending={isCancelingEvent}
              pendingLabel="Canceling event"
              variant="danger"
              onClick={async () => {
                try {
                  await onCancelEvent(cancelingEvent.id)
                  closeCancelDialog()
                } catch {
                  // Keep the dialog open with its route-owned recovery message.
                }
              }}
            >
              Cancel event
            </Button>
            <Button
              className="w-full sm:w-auto"
              variant="secondary"
              onClick={closeCancelDialog}
            >
              Keep event
            </Button>
          </div>
        </Modal>
      ) : null}

      {deletingFlock ? (
        <Modal
          description={`This permanently removes “${deletingFlock.name}”, its memberships, and its events.`}
          onClose={() => setDeletingFlock(null)}
          title="Delete flock?"
          tone="danger"
        >
          <div className="grid gap-2 sm:flex sm:flex-row-reverse">
            <Button
              isPending={isDeleting}
              pendingLabel="Deleting flock"
              variant="danger"
              onClick={async () => {
                await onDeleteFlock(deletingFlock.id)
                setDeletingFlock(null)
              }}
            >
              Delete flock
            </Button>
            <Button variant="secondary" onClick={() => setDeletingFlock(null)}>
              Keep flock
            </Button>
          </div>
        </Modal>
      ) : null}
    </section>
  )
}

function formatEventDate(startsAt: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(startsAt))
}

function getEventStatus(event: AdminEvent) {
  if (event.canceledAt) return 'Canceled'
  if (new Date(event.startsAt).getTime() < Date.now()) return 'Past'
  return 'Upcoming'
}

function getStatusClasses(status: ReturnType<typeof getEventStatus>) {
  if (status === 'Canceled') return 'border-danger text-danger'
  if (status === 'Past')
    return 'border-border bg-surface-subtle text-text-muted'
  return 'border-primary bg-surface-subtle text-primary-strong'
}

export default AdminPage
