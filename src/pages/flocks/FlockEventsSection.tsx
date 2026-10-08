import { useState } from 'react'
import EventForm from '@src/components/EventForm'
import EventRunOptions from '@src/components/EventRunOptions'
import Button from '@src/primitives/Button'
import Modal from '@src/components/Modal'
import type {
  CreateFlockEventInput,
  EventFormInput,
  EventResponse,
  FlockEvent,
} from '@src/types/events'
import type { SavedRouteLibrary } from '@src/types/savedRoutes'

export type FlockEventsSectionProps = {
  canCreate: boolean
  isCanceling: boolean
  isLoading: boolean
  isResponding: boolean
  isSaving: boolean
  onCancel: (eventId: string) => Promise<void>
  onCreate: (input: CreateFlockEventInput) => Promise<void>
  onRetry: () => void
  onRespond: (
    eventId: string,
    response: EventResponse,
    runOptionId: string | null,
  ) => Promise<void>
  onUpdate: (eventId: string, input: CreateFlockEventInput) => Promise<void>
  createError?: string
  editError?: string
  error?: string
  events?: readonly FlockEvent[]
  responseError?: string
  respondingEventId?: string
  savedRouteLibrary?: SavedRouteLibrary
}

type PendingResponse = {
  event: FlockEvent
  response: Extract<EventResponse, 'in' | 'maybe'>
}

function requireRunOptions(input: EventFormInput): CreateFlockEventInput {
  if (!input.runOptions) {
    throw new Error('Flock events require run options.')
  }
  return { ...input, runOptions: input.runOptions }
}

function FlockEventsSection({
  canCreate,
  createError,
  editError,
  error,
  events,
  isLoading,
  isSaving,
  isCanceling,
  isResponding,
  onCreate,
  onCancel,
  onRetry,
  onRespond,
  onUpdate,
  responseError,
  respondingEventId,
  savedRouteLibrary,
}: FlockEventsSectionProps) {
  const [editingEventId, setEditingEventId] = useState<string | null>(null)
  const [editingEvent, setEditingEvent] = useState<FlockEvent | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [cancelingEvent, setCancelingEvent] = useState<FlockEvent | null>(null)
  const [pendingResponse, setPendingResponse] =
    useState<PendingResponse | null>(null)
  const [selectedRunOptionId, setSelectedRunOptionId] = useState('')
  function startEditing(item: FlockEvent) {
    setEditingEventId(item.id)
    setEditingEvent(item)
  }
  function closeEditing() {
    setEditingEventId(null)
    setEditingEvent(null)
  }
  return (
    <section
      aria-labelledby="flock-events-heading"
      className="mt-8 scroll-mt-6"
      id="flock-events"
    >
      <h2
        className="font-display text-xl font-bold text-text"
        id="flock-events-heading"
      >
        Upcoming events
      </h2>
      {isLoading ? (
        <p className="mt-3 text-text-muted" role="status">
          Loading events…
        </p>
      ) : null}
      {error ? (
        <div
          className="mt-3 rounded-lg border border-accent bg-surface-subtle p-4"
          role="alert"
        >
          <p className="m-0 text-sm text-text">We could not load events.</p>
          <Button className="mt-3" variant="secondary" onClick={onRetry}>
            Try again
          </Button>
        </div>
      ) : null}
      {!isLoading && !error && events?.length === 0 ? (
        <p className="mt-3 text-text-muted">No upcoming events yet.</p>
      ) : null}
      {events?.length ? (
        <ul className="mt-3 space-y-3">
          {events.map((item) => (
            <li
              className="rounded-lg border border-border bg-background p-4"
              key={item.id}
            >
              <h3 className="m-0 font-display text-base font-bold text-text">
                {item.title}
              </h3>
              <p className="mt-1 mb-0 text-sm text-text-muted">
                {new Date(item.startsAt).toLocaleString()} · {item.location}
              </p>
              {item.description ? (
                <p className="mt-2 mb-0 text-sm leading-5 text-text-muted">
                  {item.description}
                </p>
              ) : null}
              <EventRunOptions
                groups={item.attendance.groups}
                options={item.runOptions}
                response={item.attendance.response}
                selectedRunOptionId={item.attendance.runOptionId}
              />
              <p
                aria-label={`Attendance: ${item.attendance.in} in, ${item.attendance.maybe} maybe, ${item.attendance.out} out`}
                className="mt-3 mb-2 text-sm text-text-muted"
              >
                {item.attendance.in} in · {item.attendance.maybe} maybe ·{' '}
                {item.attendance.out} out
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
                    variant={
                      item.attendance.response === response
                        ? 'primary'
                        : 'secondary'
                    }
                    aria-pressed={item.attendance.response === response}
                    isPending={isResponding && respondingEventId === item.id}
                    pendingLabel="Saving response"
                    onClick={() => {
                      if (response === 'out' || item.runOptions.length === 0) {
                        void onRespond(item.id, response, null)
                        return
                      }
                      setSelectedRunOptionId(
                        item.attendance.runOptionId ?? item.runOptions[0].id,
                      )
                      setPendingResponse({ event: item, response })
                    }}
                  >
                    {label}
                  </Button>
                ))}
              </div>
              {responseError && respondingEventId === item.id ? (
                <p className="mt-2 mb-0 text-sm text-text" role="alert">
                  {responseError}
                </p>
              ) : null}
              {canCreate && editingEventId === item.id ? (
                <Modal
                  description="Update the details so your flock has the latest plan."
                  onClose={closeEditing}
                  size="wide"
                  title="Edit event"
                >
                  <EventForm
                    error={
                      editError
                        ? 'We could not save this event. Check your connection and try again.'
                        : undefined
                    }
                    initialValues={{
                      description: editingEvent?.description ?? '',
                      location: editingEvent?.location ?? '',
                      runOptions:
                        editingEvent?.runOptions.map((option) => ({
                          distanceTenths: option.distanceTenths ?? 50,
                          id: option.id,
                          legacyLabel:
                            option.distanceTenths === null
                              ? `${option.distanceLabel} · ${option.paceLabel}`
                              : undefined,
                          paceSeconds:
                            option.distanceTenths === null
                              ? 8 * 60
                              : option.paceSeconds,
                          route: option.route ?? undefined,
                          unit: option.unit ?? 'mi',
                        })) ?? [],
                      startsAt: editingEvent?.startsAt.slice(0, 16) ?? '',
                      title: editingEvent?.title ?? '',
                    }}
                    includeRunOptions
                    isPending={isSaving}
                    mode="edit"
                    savedRouteLibrary={savedRouteLibrary}
                    onCancel={closeEditing}
                    onSubmit={async (input) => {
                      try {
                        await onUpdate(item.id, requireRunOptions(input))
                        closeEditing()
                      } catch {
                        // Preserve the open modal and draft after a failed update.
                      }
                    }}
                  />
                </Modal>
              ) : null}
              {canCreate && editingEventId !== item.id ? (
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <Button
                    className="w-full"
                    variant="secondary"
                    onClick={() => startEditing(item)}
                  >
                    Edit event
                  </Button>
                  <Button
                    className="w-full"
                    variant="danger"
                    onClick={() => setCancelingEvent(item)}
                  >
                    Cancel event
                  </Button>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
      {canCreate ? (
        <>
          <Button className="mt-6 w-full" onClick={() => setIsCreating(true)}>
            Create an event
          </Button>
          {isCreating ? (
            <Modal
              description="Add the time and place so your flock knows the plan."
              onClose={() => setIsCreating(false)}
              size="wide"
              title="Create an event"
            >
              <EventForm
                error={createError}
                includeRunOptions
                isPending={isSaving}
                mode="create"
                savedRouteLibrary={savedRouteLibrary}
                onSubmit={async (input) => {
                  try {
                    await onCreate(requireRunOptions(input))
                    setIsCreating(false)
                  } catch {
                    // Preserve the open modal and draft after a failed create.
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
                  isPending={isCanceling}
                  pendingLabel="Canceling event"
                  onClick={async () => {
                    try {
                      await onCancel(cancelingEvent.id)
                      setCancelingEvent(null)
                    } catch {
                      // Keep the confirmation open so the owner can retry.
                    }
                  }}
                  variant="danger"
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
        </>
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
            {responseError && respondingEventId === pendingResponse.event.id ? (
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

export default FlockEventsSection
