import type { PendingEventInvitation } from '@src/types/invitations'
import Button from '@src/primitives/Button'
import PendingIndicator from '@src/primitives/PendingIndicator'

type EventInvitationsSectionProps = {
  invitations: readonly PendingEventInvitation[]
  isLoading: boolean
  isRefreshing: boolean
  onAccept: (invitationId: string) => Promise<void>
  onRetry: () => void
  acceptingInvitationId?: string
  error?: string
}

function EventInvitationsSection({
  acceptingInvitationId,
  error,
  invitations,
  isLoading,
  isRefreshing,
  onAccept,
  onRetry,
}: EventInvitationsSectionProps) {
  if (!isLoading && !error && invitations.length === 0) {
    return isRefreshing ? (
      <p className="sr-only" role="status">
        Checking for event invitations…
      </p>
    ) : null
  }

  return (
    <section
      aria-labelledby="event-invitations-heading"
      className="mt-8 scroll-mt-6"
      id="event-invitations"
    >
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="m-0 text-xs font-bold tracking-[0.12em] text-primary uppercase">
            For you
          </p>
          <h2
            className="mt-1 mb-0 font-display text-xl font-bold text-text"
            id="event-invitations-heading"
          >
            Event invitations
          </h2>
        </div>
        {invitations.length > 0 ? (
          <span className="rounded-full bg-primary px-3 py-1 text-sm font-bold text-on-primary">
            {invitations.length}
          </span>
        ) : null}
      </div>

      {isLoading ? (
        <div
          className="mt-3 flex min-h-28 items-center justify-center gap-3 rounded-lg border border-border bg-surface-subtle text-text-muted"
          role="status"
        >
          <PendingIndicator />
          <span>Loading invitations…</span>
        </div>
      ) : null}

      {error ? (
        <div className="mt-3 rounded-lg border border-border bg-surface-subtle p-4">
          <p className="mt-0 mb-3 text-sm leading-5 text-text" role="alert">
            {error}
          </p>
          <Button variant="secondary" onClick={onRetry}>
            Try again
          </Button>
        </div>
      ) : null}

      {invitations.length > 0 ? (
        <ul className="mt-3 space-y-3">
          {invitations.map((invitation) => {
            const isAccepting =
              acceptingInvitationId === invitation.invitationId
            return (
              <li
                className="rounded-lg border border-primary/30 bg-surface-subtle p-4"
                key={invitation.invitationId}
              >
                <p className="m-0 text-xs font-bold tracking-[0.08em] text-primary-strong uppercase">
                  {invitation.audienceType === 'flock' &&
                  invitation.audienceName
                    ? `Invited with ${invitation.audienceName}`
                    : 'Personal invitation'}
                </p>
                <h3 className="mt-1 mb-0 font-display text-lg font-bold text-text">
                  {invitation.eventTitle}
                </h3>
                <p className="mt-1 mb-0 text-sm text-text-muted">
                  {new Date(invitation.eventStartsAt).toLocaleString()} ·{' '}
                  {invitation.eventLocation}
                </p>
                {invitation.eventDescription ? (
                  <p className="mt-2 mb-0 text-sm leading-5 text-text-muted">
                    {invitation.eventDescription}
                  </p>
                ) : null}
                <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <p className="m-0 text-xs text-text-muted">
                    Expires {new Date(invitation.expiresAt).toLocaleString()}
                  </p>
                  <Button
                    className="w-full sm:w-auto"
                    disabled={
                      acceptingInvitationId !== undefined && !isAccepting
                    }
                    isPending={isAccepting}
                    pendingLabel="Accepting invitation"
                    onClick={() => {
                      void onAccept(invitation.invitationId).catch(() => {
                        // Keep the invitation visible with route-owned recovery.
                      })
                    }}
                  >
                    Accept invitation
                  </Button>
                </div>
              </li>
            )
          })}
        </ul>
      ) : null}
    </section>
  )
}

export default EventInvitationsSection
