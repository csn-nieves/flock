import { useState } from 'react'
import EventForm from '@src/components/EventForm'
import Modal from '@src/components/Modal'
import Button from '@src/primitives/Button'
import PendingIndicator from '@src/primitives/PendingIndicator'
import type { FlockEvent } from '@src/types/events'
import type { EventResponse } from '@src/types/events'
import InvitationLinkCard, {
  type ShareInvitationResult,
} from './flocks/InvitationLinkCard'

export type EventsPageProps = {
  events: readonly FlockEvent[]
  isRefreshing: boolean
  onCreate: (
    input: Parameters<
      NonNullable<React.ComponentProps<typeof EventForm>['onSubmit']>
    >[0],
  ) => void
  isCreating: boolean
  createError?: string
  invitationUrl?: string
  invitationError?: string
  isInviting: boolean
  onInvite: (eventId: string) => void
  onCopyInvitation: (url: string) => Promise<void>
  onShareInvitation?: (url: string) => Promise<ShareInvitationResult>
  isResponding: boolean
  responseError?: string
  onRespond: (eventId: string, response: EventResponse) => void
}

function EventsPage({
  createError,
  events,
  isCreating,
  isRefreshing,
  onCreate,
  invitationError,
  invitationUrl,
  isInviting,
  onCopyInvitation,
  onInvite,
  onShareInvitation,
  isResponding,
  onRespond,
  responseError,
}: EventsPageProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  let invitationContent = null

  if (invitationUrl) {
    invitationContent = (
      <div className="mt-6">
        <InvitationLinkCard
          invitationUrl={invitationUrl}
          onCopy={onCopyInvitation}
          onShare={onShareInvitation}
        />
      </div>
    )
  } else if (invitationError) {
    invitationContent = (
      <p className="mt-6 text-sm text-text" role="alert">
        {invitationError}
      </p>
    )
  }

  return (
    <section
      aria-labelledby="events-heading"
      className="mx-auto w-full max-w-xl py-8 sm:py-12"
    >
      <header>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1
              className="m-0 font-display text-3xl font-bold leading-tight tracking-[-0.025em] text-text"
              id="events-heading"
            >
              Your events
            </h1>
            <p className="mt-2 mb-0 max-w-sm leading-6 text-text-muted">
              Plan a run and invite the runners you want there.
            </p>
          </div>
          <Button onClick={() => setIsCreateOpen(true)}>Create event</Button>
        </div>
      </header>

      {isRefreshing ? (
        <p className="sr-only" role="status">
          Refreshing your events…
        </p>
      ) : null}
      {events.length === 0 ? (
        <div className="mt-8 rounded-lg border border-border bg-surface-subtle px-4 py-5">
          <h2 className="m-0 font-display text-lg font-bold text-text">
            No personal events yet
          </h2>
          <p className="mt-2 mb-0 leading-6 text-text-muted">
            Create an event for any runners you want to bring together.
          </p>
        </div>
      ) : (
        <ul className="mt-8 space-y-3">
          {events.map((event) => (
            <li
              className="rounded-lg border border-border bg-background p-4"
              key={event.id}
            >
              <h2 className="m-0 font-display text-base font-bold text-text">
                {event.title}
              </h2>
              <p className="mt-1 mb-0 text-sm text-text-muted">
                {new Date(event.startsAt).toLocaleString()} · {event.location}
              </p>
              {event.description ? (
                <p className="mt-2 mb-0 text-sm leading-5 text-text-muted">
                  {event.description}
                </p>
              ) : null}
              <p
                aria-label={`Attendance: ${event.attendance.in} in, ${event.attendance.maybe} maybe, ${event.attendance.out} out`}
                className="mt-3 mb-2 text-sm text-text-muted"
              >
                {event.attendance.in} in · {event.attendance.maybe} maybe ·{' '}
                {event.attendance.out} out
              </p>
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    ['in', "I'm in"],
                    ['maybe', 'Maybe'],
                    ['out', "I'm out"],
                  ] as const
                ).map(([response, label]) => (
                  <Button
                    key={response}
                    aria-pressed={event.attendance.response === response}
                    isPending={isResponding}
                    pendingLabel="Saving response"
                    variant={
                      event.attendance.response === response
                        ? 'primary'
                        : 'secondary'
                    }
                    onClick={() => onRespond(event.id, response)}
                  >
                    {label}
                  </Button>
                ))}
              </div>
              {responseError ? (
                <p className="mt-2 mb-0 text-sm text-text" role="alert">
                  {responseError}
                </p>
              ) : null}
              <Button
                className="mt-3"
                isPending={isInviting}
                pendingLabel="Creating invitation"
                variant="secondary"
                onClick={() => onInvite(event.id)}
              >
                Invite runners
              </Button>
            </li>
          ))}
        </ul>
      )}

      {invitationContent}

      {isCreateOpen ? (
        <Modal
          description="Set the details before you invite runners."
          onClose={() => setIsCreateOpen(false)}
          title="Create an event"
        >
          <EventForm
            error={createError}
            isPending={isCreating}
            mode="create"
            onCancel={() => setIsCreateOpen(false)}
            onSubmit={async (input) => {
              try {
                await onCreate(input)
                setIsCreateOpen(false)
              } catch {
                // Keep the modal and form values available after a failed request.
              }
            }}
          />
        </Modal>
      ) : null}
    </section>
  )
}

export function EventsLoadingPage() {
  return (
    <div
      className="flex min-h-48 items-center justify-center gap-3 py-12 text-text-muted"
      role="status"
    >
      <PendingIndicator />
      <span>Loading your events…</span>
    </div>
  )
}

export function EventsErrorPage({
  isRetrying,
  onRetry,
}: {
  isRetrying: boolean
  onRetry: () => void
}) {
  return (
    <section
      aria-labelledby="events-error-heading"
      className="mx-auto w-full max-w-xl py-8 sm:py-12"
    >
      <h1
        className="m-0 font-display text-3xl font-bold text-text"
        id="events-error-heading"
      >
        Your events are unavailable
      </h1>
      <p className="mt-2 text-text-muted">
        We could not load your events. Check your connection and try again.
      </p>
      <Button
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

export default EventsPage
