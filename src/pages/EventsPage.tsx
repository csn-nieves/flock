import { useState } from 'react'
import EventForm from '@src/components/EventForm'
import EventRunOptions from '@src/components/EventRunOptions'
import Modal from '@src/components/Modal'
import Button from '@src/primitives/Button'
import PendingIndicator from '@src/primitives/PendingIndicator'
import type { FlockSearchResult, RunnerSearchResult } from '@src/data/discovery'
import type {
  EventFormInput,
  EventResponse,
  EventWithRunOptionsInput,
  FlockEvent,
} from '@src/types/events'
import type {
  EventAudienceInvitationLink,
  PendingEventInvitation,
} from '@src/types/invitations'
import type { SavedRouteLibrary } from '@src/types/savedRoutes'
import { eventToFormValues } from '@src/lib/eventPlanning'
import InvitationLinkCard, {
  type ShareInvitationResult,
} from './flocks/InvitationLinkCard'
import EventAudiencePicker, {
  type EventAudienceType,
} from '@src/components/EventAudiencePicker'
import EventInvitationsSection from './events/EventInvitationsSection'

export type EventsPageProps = {
  audienceSearchTerm: string
  audienceType: EventAudienceType
  canManageAllEvents: boolean
  currentUserId: string
  events: readonly FlockEvent[]
  flockResults: readonly FlockSearchResult[]
  pendingInvitations: readonly PendingEventInvitation[]
  isCreating: boolean
  isInviting: boolean
  invitationLink: EventAudienceInvitationLink | undefined
  isLoadingInvitations: boolean
  isRefreshingInvitations: boolean
  isRefreshing: boolean
  isResponding: boolean
  isSaving: boolean
  isSearchingAudience: boolean
  runnerResults: readonly RunnerSearchResult[]
  savedRouteLibrary?: SavedRouteLibrary
  onAudienceSearchTermChange: (searchTerm: string) => void
  onAudienceTypeChange: (audienceType: EventAudienceType) => void
  onAcceptInvitation: (invitationId: string) => Promise<void>
  onCancelEvent: (eventId: string) => Promise<void>
  onCloseInvitation: () => void
  onCopyInvitation: (url: string) => Promise<void>
  onCreate: (input: EventWithRunOptionsInput) => void
  onInviteFlock: (
    eventId: string,
    flockId: string,
    flockName: string,
  ) => Promise<void>
  onInviteRunner: (
    eventId: string,
    recipientUserId: string,
    recipientDisplayName: string,
  ) => Promise<void>
  onOpenEvent?: (eventId: string) => void
  onRespond: (
    eventId: string,
    response: EventResponse,
    runOptionId: string | null,
  ) => Promise<unknown>
  onRetryInvitations: () => void
  onUpdate: (eventId: string, input: EventWithRunOptionsInput) => Promise<void>
  createError?: string
  acceptingInvitationId?: string
  invitationInboxError?: string
  invitationError?: string
  managementError?: string
  onShareInvitation?: (url: string) => Promise<ShareInvitationResult>
  responseError?: string
}

type PendingResponse = {
  event: FlockEvent
  response: Extract<EventResponse, 'in' | 'maybe'>
}

function requireRunOptions(input: EventFormInput): EventWithRunOptionsInput {
  if (!input.runOptions) {
    throw new Error('Run events require run options.')
  }
  return { ...input, runOptions: input.runOptions }
}

function EventsPage({
  audienceSearchTerm,
  audienceType,
  canManageAllEvents,
  createError,
  currentUserId,
  events,
  flockResults,
  pendingInvitations,
  isCreating,
  isRefreshing,
  isSearchingAudience,
  runnerResults,
  savedRouteLibrary,
  onAudienceSearchTermChange,
  onAudienceTypeChange,
  onCreate,
  invitationError,
  invitationLink,
  isLoadingInvitations,
  isRefreshingInvitations,
  isInviting,
  onInviteFlock,
  onInviteRunner,
  onOpenEvent,
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
  acceptingInvitationId,
  invitationInboxError,
  onAcceptInvitation,
  onRetryInvitations,
}: EventsPageProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [invitingEventId, setInvitingEventId] = useState<string>()
  const [cancelingEvent, setCancelingEvent] = useState<FlockEvent | null>(null)
  const [repeatingEvent, setRepeatingEvent] = useState<FlockEvent | null>(null)
  const [pendingResponse, setPendingResponse] =
    useState<PendingResponse | null>(null)
  const [selectedRunOptionId, setSelectedRunOptionId] = useState('')
  const canManageEvent = (event: FlockEvent) =>
    canManageAllEvents || event.createdBy === currentUserId
  let invitationDialog = null

  if (invitationLink) {
    const isFlockInvitation = invitationLink.audienceType === 'flock'
    invitationDialog = (
      <Modal
        description={
          isFlockInvitation
            ? `${invitationLink.audienceName} members will see this invitation in Flock. The link is optional.`
            : `${invitationLink.audienceName} will see this invitation in Flock. The private link is optional.`
        }
        onClose={onCloseInvitation}
        title="Invitation sent"
      >
        <InvitationLinkCard
          expiresInLabel="7 days"
          invitationUrl={invitationLink.url}
          linkScope={isFlockInvitation ? 'flock' : 'single-use'}
          recipientName={invitationLink.audienceName}
          onCopy={onCopyInvitation}
          onShare={onShareInvitation}
        />
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
      <EventInvitationsSection
        acceptingInvitationId={acceptingInvitationId}
        error={invitationInboxError}
        invitations={pendingInvitations}
        isLoading={isLoadingInvitations}
        isRefreshing={isRefreshingInvitations}
        onAccept={onAcceptInvitation}
        onRetry={onRetryInvitations}
      />
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
              {event.imageUrl ? (
                <img
                  alt=""
                  className="mb-4 aspect-[16/7] w-full rounded-lg object-cover"
                  src={event.imageUrl}
                />
              ) : null}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="m-0 font-display text-base font-bold text-text">
                    {event.title}
                  </h2>
                  {onOpenEvent ? (
                    <Button
                      className="mt-1 min-h-0 px-0 py-0 text-sm text-primary"
                      variant="ghost"
                      onClick={() => onOpenEvent(event.id)}
                    >
                      View details
                    </Button>
                  ) : null}
                </div>
                {canManageEvent(event) ? (
                  <Button
                    className="shrink-0"
                    isPending={isInviting}
                    pendingLabel="Creating invitation"
                    variant="primary"
                    onClick={() => setInvitingEventId(event.id)}
                  >
                    Invite runners
                  </Button>
                ) : null}
              </div>
              <p className="mt-1 mb-0 text-sm text-text-muted">
                {new Date(event.startsAt).toLocaleString()} · {event.location}
              </p>
              {event.description ? (
                <p className="mt-2 mb-0 text-sm leading-5 text-text-muted">
                  {event.description}
                </p>
              ) : null}
              <EventRunOptions
                groups={event.attendance.groups}
                options={event.runOptions}
                response={event.attendance.response}
                selectedRunOptionId={event.attendance.runOptionId}
              />
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
                    onClick={() => {
                      if (response === 'out' || event.runOptions.length === 0) {
                        void onRespond(event.id, response, null)
                        return
                      }
                      setSelectedRunOptionId(
                        event.attendance.runOptionId ?? event.runOptions[0].id,
                      )
                      setPendingResponse({ event, response })
                    }}
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
              {canManageEvent(event) ? (
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <Button
                    className="w-full"
                    variant="secondary"
                    onClick={() => setRepeatingEvent(event)}
                  >
                    Repeat event
                  </Button>
                  <Button
                    className="w-full"
                    variant="secondary"
                    onClick={() => setEditingEvent(event)}
                  >
                    Edit event
                  </Button>
                  <Button
                    className="col-span-2 w-full"
                    variant="danger"
                    onClick={() => setCancelingEvent(event)}
                  >
                    Cancel event
                  </Button>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      {invitationDialog}
      {invitingEventId ? (
        <Modal
          description="Choose one runner or invite a flock as a live audience."
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
            onSelectFlock={async (flockId, flockName) => {
              try {
                await onInviteFlock(invitingEventId, flockId, flockName)
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
          size="wide"
          title="Edit event"
        >
          <EventForm
            initialValues={eventToFormValues(editingEvent, 'edit')}
            includeRunOptions
            isPending={isSaving}
            mode="edit"
            savedRouteLibrary={savedRouteLibrary}
            onCancel={() => setEditingEvent(null)}
            onSubmit={async (input) => {
              try {
                await onUpdate(editingEvent.id, requireRunOptions(input))
                setEditingEvent(null)
              } catch {
                // Keep the modal open after a failed update.
              }
            }}
          />
        </Modal>
      ) : null}

      {repeatingEvent ? (
        <Modal
          description="Start a new event with the same plan. Choose a new date; invitations and responses will not be copied."
          onClose={() => setRepeatingEvent(null)}
          size="wide"
          title="Repeat event"
        >
          <EventForm
            error={createError}
            includeRunOptions
            initialValues={eventToFormValues(repeatingEvent, 'repeat')}
            isPending={isCreating}
            mode="create"
            savedRouteLibrary={savedRouteLibrary}
            onCancel={() => setRepeatingEvent(null)}
            onSubmit={async (input) => {
              try {
                await onCreate(requireRunOptions(input))
                setRepeatingEvent(null)
              } catch {
                // Keep the modal and repeated plan available after a failed request.
              }
            }}
          />
        </Modal>
      ) : null}

      {isCreateOpen ? (
        <Modal
          description="Set the details before you invite runners."
          onClose={() => setIsCreateOpen(false)}
          size="wide"
          title="Create an event"
        >
          <EventForm
            error={createError}
            includeRunOptions
            isPending={isCreating}
            mode="create"
            savedRouteLibrary={savedRouteLibrary}
            onCancel={() => setIsCreateOpen(false)}
            onSubmit={async (input) => {
              try {
                await onCreate(requireRunOptions(input))
                setIsCreateOpen(false)
              } catch {
                // Keep the modal and form values available after a failed request.
              }
            }}
          />
        </Modal>
      ) : null}
      {pendingResponse ? (
        <Modal
          description={`Choose the plan you want to join for “${pendingResponse.event.title}.”`}
          onClose={() => setPendingResponse(null)}
          title="Choose your run"
        >
          <form
            noValidate
            onSubmit={async (event) => {
              event.preventDefault()
              try {
                await onRespond(
                  pendingResponse.event.id,
                  pendingResponse.response,
                  selectedRunOptionId,
                )
                setPendingResponse(null)
              } catch {
                // Keep the selection open so the runner can retry.
              }
            }}
          >
            <fieldset className="space-y-2">
              <legend className="sr-only">Run option</legend>
              {pendingResponse.event.runOptions.map((option) => (
                <label
                  className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border border-border px-3 py-2 text-sm text-text has-checked:border-accent has-checked:bg-surface-subtle"
                  key={option.id}
                >
                  <input
                    checked={selectedRunOptionId === option.id}
                    name="event-run-option"
                    type="radio"
                    value={option.id}
                    onChange={(event) =>
                      setSelectedRunOptionId(event.target.value)
                    }
                  />
                  <span>
                    <strong>{option.distanceLabel}</strong>
                    <span className="block text-text-muted">
                      {option.paceLabel}
                    </span>
                  </span>
                </label>
              ))}
            </fieldset>
            {responseError ? (
              <p className="mt-3 mb-0 text-sm text-text" role="alert">
                {responseError}
              </p>
            ) : null}
            <div className="mt-4 grid gap-2 sm:flex sm:flex-row-reverse">
              <Button
                className="w-full sm:w-auto"
                isPending={isResponding}
                pendingLabel="Saving response"
                type="submit"
              >
                Save response
              </Button>
              <Button
                className="w-full sm:w-auto"
                type="button"
                variant="secondary"
                onClick={() => setPendingResponse(null)}
              >
                Cancel
              </Button>
            </div>
          </form>
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
