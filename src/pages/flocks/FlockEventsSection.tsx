import { useState, type FormEvent } from 'react'
import Button from '@src/primitives/Button'
import TextField from '@src/primitives/TextField'
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
  const [title, setTitle] = useState('')
  const [startsAt, setStartsAt] = useState('')
  const [location, setLocation] = useState('')
  const [description, setDescription] = useState('')
  const [editingEventId, setEditingEventId] = useState<string | null>(null)
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!title.trim() || !startsAt || !location.trim()) return
    onCreate({
      description: description.trim(),
      location: location.trim(),
      startsAt: new Date(startsAt).toISOString(),
      title: title.trim(),
    })
    setTitle('')
    setStartsAt('')
    setLocation('')
    setDescription('')
  }
  function startEditing(item: FlockEvent) {
    setEditingEventId(item.id)
    setTitle(item.title)
    setStartsAt(item.startsAt.slice(0, 16))
    setLocation(item.location)
    setDescription(item.description)
  }
  async function submitEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!editingEventId || !title.trim() || !startsAt || !location.trim())
      return
    try {
      await onUpdate(editingEventId, {
        description: description.trim(),
        location: location.trim(),
        startsAt: new Date(startsAt).toISOString(),
        title: title.trim(),
      })
      setEditingEventId(null)
    } catch {
      // The route owns the mutation error; keeping the form open preserves the draft.
    }
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
                <form className="mt-4 space-y-3" onSubmit={submitEdit}>
                  {editError ? (
                    <p className="m-0 text-sm text-text" role="alert">
                      We could not save this event. Check your connection and
                      try again.
                    </p>
                  ) : null}
                  <TextField
                    label="Title"
                    name={`edit-title-${item.id}`}
                    required
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                  />
                  <TextField
                    label="Date and time"
                    name={`edit-starts-${item.id}`}
                    required
                    type="datetime-local"
                    value={startsAt}
                    onChange={(event) => setStartsAt(event.target.value)}
                  />
                  <TextField
                    label="Location"
                    name={`edit-location-${item.id}`}
                    required
                    value={location}
                    onChange={(event) => setLocation(event.target.value)}
                  />
                  <TextField
                    label="Description"
                    name={`edit-description-${item.id}`}
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                  />
                  <div className="flex flex-wrap gap-2">
                    <Button
                      isPending={isSaving}
                      pendingLabel="Saving event"
                      type="submit"
                    >
                      Save event
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => setEditingEventId(null)}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
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
        <form
          className="mt-6 space-y-3 rounded-lg border border-border bg-surface-subtle p-4"
          onSubmit={submit}
        >
          <h3 className="m-0 font-display text-base font-bold text-text">
            Create an event
          </h3>
          <TextField
            label="Title"
            name="eventTitle"
            required
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
          <TextField
            label="Date and time"
            name="startsAt"
            required
            type="datetime-local"
            value={startsAt}
            onChange={(event) => setStartsAt(event.target.value)}
          />
          <TextField
            label="Location"
            name="eventLocation"
            required
            value={location}
            onChange={(event) => setLocation(event.target.value)}
          />
          <TextField
            label="Description"
            name="eventDescription"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
          <Button
            isPending={isSaving}
            pendingLabel="Creating event"
            type="submit"
          >
            Create event
          </Button>
        </form>
      ) : null}
    </section>
  )
}

export default FlockEventsSection
