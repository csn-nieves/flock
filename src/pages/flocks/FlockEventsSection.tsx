import { useState } from 'react'
import EventForm from '@src/components/EventForm'
import Button from '@src/primitives/Button'
import Modal from '@src/components/Modal'
import type {
  CreateFlockEventInput,
  EventResponse,
  FlockEvent,
} from '@src/types/events'

export type FlockEventsSectionProps = {
  editError?: string
  error?: string
  events?: readonly FlockEvent[]
  isLoading: boolean
  isSaving: boolean
  canCreate: boolean
  onCreate: (input: CreateFlockEventInput) => void
  onRetry: () => void
  onRespond: (eventId: string, response: EventResponse) => void
  onUpdate: (eventId: string, input: CreateFlockEventInput) => Promise<void>
}

function FlockEventsSection({
  canCreate,
  editError,
  error,
  events,
  isLoading,
  isSaving,
  onCreate,
  onRetry,
  onRespond,
  onUpdate,
}: FlockEventsSectionProps) {
  const [editingEventId, setEditingEventId] = useState<string | null>(null)
  const [editingEvent, setEditingEvent] = useState<FlockEvent | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  function startEditing(item: FlockEvent) {
    setEditingEventId(item.id)
    setEditingEvent(item)
  }
  function closeEditing() {
    setEditingEventId(null)
    setEditingEvent(null)
  }
  return (
    <section aria-labelledby="flock-events-heading" className="mt-8">
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
              <p
                aria-label={`Attendance: ${item.attendance.in} in, ${item.attendance.maybe} maybe, ${item.attendance.out} out`}
                className="mt-3 mb-2 text-sm text-text-muted"
              >
                {item.attendance.in} in · {item.attendance.maybe} maybe ·{' '}
                {item.attendance.out} out
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
                    variant={
                      item.attendance.response === response
                        ? 'primary'
                        : 'secondary'
                    }
                    aria-pressed={item.attendance.response === response}
                    onClick={() => onRespond(item.id, response)}
                  >
                    {label}
                  </Button>
                ))}
              </div>
              {canCreate && editingEventId === item.id ? (
                <Modal
                  description="Update the details so your flock has the latest plan."
                  onClose={closeEditing}
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
                      startsAt: editingEvent?.startsAt.slice(0, 16) ?? '',
                      title: editingEvent?.title ?? '',
                    }}
                    isPending={isSaving}
                    mode="edit"
                    onCancel={closeEditing}
                    onSubmit={async (input) => {
                      try {
                        await onUpdate(item.id, input)
                        closeEditing()
                      } catch {
                        // Preserve the open modal and draft after a failed update.
                      }
                    }}
                  />
                </Modal>
              ) : null}
              {canCreate && editingEventId !== item.id ? (
                <Button
                  className="mt-3"
                  variant="secondary"
                  onClick={() => startEditing(item)}
                >
                  Edit event
                </Button>
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
              title="Create an event"
            >
              <EventForm
                isPending={isSaving}
                mode="create"
                onSubmit={(input) => {
                  onCreate(input)
                  setIsCreating(false)
                }}
              />
            </Modal>
          ) : null}
        </>
      ) : null}
    </section>
  )
}

export default FlockEventsSection
