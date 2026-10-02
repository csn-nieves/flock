import { useState } from 'react'
import EventForm from '@src/components/EventForm'
import Modal from '@src/components/Modal'
import Button from '@src/primitives/Button'
import PendingIndicator from '@src/primitives/PendingIndicator'
import type { FlockSearchResult, RunnerSearchResult } from '@src/data/discovery'
import type { FlockEvent } from '@src/types/events'
import type { EventResponse } from '@src/types/events'
import type { EventRecipientInvitationLink } from '@src/types/invitations'
import InvitationLinkCard, {
  type ShareInvitationResult,
} from './flocks/InvitationLinkCard'
import EventAudiencePicker, {
  type EventAudienceType,
} from '@src/components/EventAudiencePicker'

export type EventsPageProps = {
  audienceSearchTerm: string
  audienceType: EventAudienceType
  events: readonly FlockEvent[]
  flockResults: readonly FlockSearchResult[]
  isCreating: boolean
  isInviting: boolean
  invitationLinks: readonly EventRecipientInvitationLink[]
  isRefreshing: boolean
  isResponding: boolean
  isSaving: boolean
  isSearchingAudience: boolean
  runnerResults: readonly RunnerSearchResult[]
  onAudienceSearchTermChange: (searchTerm: string) => void
  onAudienceTypeChange: (audienceType: EventAudienceType) => void
  onCancelEvent: (eventId: string) => Promise<void>
  onCloseInvitation: () => void
  onCopyInvitation: (url: string) => Promise<void>
  onCreate: (
    input: Parameters<
      NonNullable<React.ComponentProps<typeof EventForm>['onSubmit']>
    >[0],
  ) => void
  onInviteFlock: (eventId: string, flockId: string) => Promise<void>
  onInviteRunner: (
    eventId: string,
    recipientUserId: string,
    recipientDisplayName: string,
  ) => Promise<void>
  onRespond: (eventId: string, response: EventResponse) => void
  onUpdate: (
    eventId: string,
    input: Parameters<
      NonNullable<React.ComponentProps<typeof EventForm>['onSubmit']>
    >[0],
  ) => Promise<void>
  createError?: string
  invitationError?: string
  managementError?: string
  onShareInvitation?: (url: string) => Promise<ShareInvitationResult>
  responseError?: string
}

function EventsPage({
  audienceSearchTerm,
  audienceType,
  createError,
  events,
  flockResults,
  isCreating,
  isRefreshing,
  isSearchingAudience,
  runnerResults,
  onAudienceSearchTermChange,
  onAudienceTypeChange,
  onCreate,
  invitationError,
  invitationLinks,
  isInviting,
  onInviteFlock,
  onInviteRunner,
  onCopyInvitation,
  onShareInvitation,
  onCloseInvitation,
  isResponding,
  onRespond,
  responseError,
  isSaving,
  onUpdate,
  onCancelEvent,
  managementError,
}: EventsPageProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [invitingEventId, setInvitingEventId] = useState<string>()
  const [cancelingEvent, setCancelingEvent] = useState<FlockEvent | null>(null)
  let invitationDialog = null

  if (invitationLinks.length > 0) {
    invitationDialog = (
      <Modal
        description={
          invitationLinks.length === 1
            ? 'Share this private link with its runner.'
            : `Share each private link with the named runner. ${invitationLinks.length} invitations were created from the flock’s current members.`
        }
        onClose={onCloseInvitation}
        title={
          invitationLinks.length === 1
            ? 'Invitation ready'
            : 'Flock invitations ready'
        }
      >
        <div className="grid gap-4">
          {invitationLinks.map((invitation) => (
            <InvitationLinkCard
              invitationUrl={invitation.url}
              key={invitation.recipientUserId}
              recipientName={invitation.recipientDisplayName}
              onCopy={onCopyInvitation}
              onShare={onShareInvitation}
            />
          ))}
        </div>
      </Modal>
    )
  }
  const [editingEvent, setEditingEvent] = useState<FlockEvent | null>(null)

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
              <div className="flex items-start justify-between gap-3">
                <h2 className="m-0 font-display text-base font-bold text-text">
                  {event.title}
                </h2>
                <Button
                  className="shrink-0"
                  isPending={isInviting}
                  pendingLabel="Creating invitation"
                  variant="primary"
                  onClick={() => setInvitingEventId(event.id)}
                >
                  Invite runners
                </Button>
              </div>
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
              <div className="grid grid-cols-3 gap-2">
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
              <div className="mt-2 grid grid-cols-2 gap-2">
                <Button
                  className="w-full"
                  variant="secondary"
                  onClick={() => setEditingEvent(event)}
                >
                  Edit event
                </Button>
                <Button
                  className="w-full"
                  variant="danger"
                  onClick={() => setCancelingEvent(event)}
                >
                  Cancel event
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {invitationDialog}
      {invitingEventId ? (
        <Modal
          description="Choose one runner or snapshot a flock’s current members."
          onClose={() => {
            setInvitingEventId(undefined)
            onAudienceSearchTermChange('')
          }}
          title="Choose an audience"
        >
          <EventAudiencePicker
            audienceType={audienceType}
            flocks={flockResults}
            isInviting={isInviting}
            isSearching={isSearchingAudience}
            runners={runnerResults}
            searchError={invitationError}
            searchTerm={audienceSearchTerm}
            onAudienceTypeChange={onAudienceTypeChange}
            onCancel={() => {
              setInvitingEventId(undefined)
              onAudienceSearchTermChange('')
            }}
            onSearchTermChange={onAudienceSearchTermChange}
            onSelectFlock={async (flockId) => {
              try {
                await onInviteFlock(invitingEventId, flockId)
                setInvitingEventId(undefined)
                onAudienceSearchTermChange('')
              } catch {
                // Keep the picker open so the owner can retry.
              }
            }}
            onSelectRunner={async (userId, displayName) => {
              try {
                await onInviteRunner(invitingEventId, userId, displayName)
                setInvitingEventId(undefined)
                onAudienceSearchTermChange('')
              } catch {
                // Keep the picker open so the owner can retry.
              }
            }}
          />
        </Modal>
      ) : null}

      {cancelingEvent ? (
        <Modal
          description={`This will remove “${cancelingEvent.title}” from upcoming events while keeping attendance history.`}
          onClose={() => setCancelingEvent(null)}
          title="Cancel event?"
          tone="danger"
        >
          <div className="grid gap-2 sm:flex sm:flex-row-reverse">
            <Button
              className="w-full sm:w-auto"
              isPending={isSaving}
              pendingLabel="Canceling event"
              variant="danger"
              onClick={async () => {
                try {
                  await onCancelEvent(cancelingEvent.id)
                  setCancelingEvent(null)
                } catch {
                  // Keep the confirmation open so the owner can retry.
                }
              }}
            >
              Cancel event
            </Button>
            <Button
              className="w-full sm:w-auto"
              type="button"
              variant="secondary"
              onClick={() => setCancelingEvent(null)}
            >
              Keep event
            </Button>
          </div>
        </Modal>
      ) : null}

      {managementError ? (
        <p className="mt-4 text-sm text-text" role="alert">
          {managementError}
        </p>
      ) : null}

      {editingEvent ? (
        <Modal
          description="Update the plan for everyone invited."
          onClose={() => setEditingEvent(null)}
          title="Edit event"
        >
          <EventForm
            initialValues={{
              description: editingEvent.description,
              location: editingEvent.location,
              startsAt: editingEvent.startsAt.slice(0, 16),
              title: editingEvent.title,
            }}
            isPending={isSaving}
            mode="edit"
            onCancel={() => setEditingEvent(null)}
            onSubmit={async (input) => {
              try {
                await onUpdate(editingEvent.id, input)
                setEditingEvent(null)
              } catch {
                // Keep the modal open after a failed update.
              }
            }}
          />
        </Modal>
      ) : null}

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
