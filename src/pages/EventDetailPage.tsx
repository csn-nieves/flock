import { useState } from 'react'
import EventRunOptions from '@src/components/EventRunOptions'
import Modal from '@src/components/Modal'
import Button from '@src/primitives/Button'
import PendingIndicator from '@src/primitives/PendingIndicator'
import type { EventResponse, FlockEvent } from '@src/types/events'

type EventDetailPageProps = {
  event: FlockEvent
  isResponding: boolean
  onBack: () => void
  onRespond: (
    eventId: string,
    response: EventResponse,
    runOptionId: string | null,
  ) => Promise<void>
  responseError?: string
}

type PendingChoice = Extract<EventResponse, 'in' | 'maybe'>

function eventKind(event: FlockEvent) {
  return event.flockId ? 'FLOCK EVENT' : 'PERSONAL EVENT'
}

function calendarUrl(event: FlockEvent) {
  const start = new Date(event.startsAt)
  const end = new Date(start.getTime() + 90 * 60 * 1000)
  const format = (value: Date) =>
    value.toISOString().replace(/[-:]|\.\d{3}/g, '')
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    dates: `${format(start)}/${format(end)}`,
    details: event.description,
    location: event.location,
    text: event.title,
  })
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

function EventDetailPage({
  event,
  isResponding,
  onBack,
  onRespond,
  responseError,
}: EventDetailPageProps) {
  const [pendingChoice, setPendingChoice] = useState<PendingChoice>()
  const [selectedRunOptionId, setSelectedRunOptionId] = useState('')

  async function respond(response: EventResponse) {
    if (response === 'out' || event.runOptions.length === 0) {
      await onRespond(event.id, response, null)
      return
    }
    if (event.runOptions.length === 1) {
      await onRespond(event.id, response, event.runOptions[0].id)
      return
    }
    setSelectedRunOptionId(
      event.attendance.runOptionId ?? event.runOptions[0].id,
    )
    setPendingChoice(response)
  }

  async function confirmChoice() {
    if (!pendingChoice || !selectedRunOptionId) return
    await onRespond(event.id, pendingChoice, selectedRunOptionId)
    setPendingChoice(undefined)
  }

  return (
    <section
      aria-labelledby="event-detail-heading"
      className="mx-auto w-full max-w-3xl py-6 sm:py-10"
    >
      <Button variant="ghost" onClick={onBack}>
        ← Back to events
      </Button>
      <article className="mt-4 overflow-hidden rounded-2xl border border-border bg-background shadow-sm">
        {event.imageUrl ? (
          <img
            alt=""
            className="aspect-[16/7] w-full object-cover"
            src={event.imageUrl}
          />
        ) : null}
        <div className="p-5 sm:p-8">
          <p className="m-0 text-xs font-bold tracking-[0.14em] text-primary">
            {eventKind(event)}
          </p>
          <h1
            className="mt-3 mb-0 max-w-2xl font-display text-3xl font-bold leading-tight tracking-[-0.03em] text-text sm:text-4xl"
            id="event-detail-heading"
          >
            {event.title}
          </h1>
          <div className="mt-5 grid gap-3 border-y border-border py-4 text-sm sm:grid-cols-2">
            <div>
              <p className="m-0 text-xs font-bold uppercase tracking-[0.1em] text-text-muted">
                When
              </p>
              <p className="mt-1 mb-0 text-text">
                {new Date(event.startsAt).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="m-0 text-xs font-bold uppercase tracking-[0.1em] text-text-muted">
                Where
              </p>
              <p className="mt-1 mb-0 text-text">{event.location}</p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <a
              className="inline-flex min-h-touch items-center justify-center rounded-md border border-border bg-background px-4 py-2 font-display text-[0.9375rem] font-bold leading-5 text-text transition-colors hover:bg-surface-subtle"
              href={calendarUrl(event)}
              rel="noreferrer"
              target="_blank"
            >
              Add to calendar
            </a>
            <a
              className="inline-flex min-h-touch items-center justify-center rounded-md border border-border bg-background px-4 py-2 font-display text-[0.9375rem] font-bold leading-5 text-text transition-colors hover:bg-surface-subtle"
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location)}`}
              rel="noreferrer"
              target="_blank"
            >
              Get directions
            </a>
          </div>
          {event.description ? (
            <p className="mt-6 mb-0 max-w-2xl text-base leading-7 text-text-muted">
              {event.description}
            </p>
          ) : null}
          <div className="mt-7 rounded-xl bg-surface-subtle p-4 sm:p-5">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="m-0 text-xs font-bold uppercase tracking-[0.1em] text-text-muted">
                  Attendance
                </p>
                <p className="mt-1 mb-0 text-lg font-bold text-text">
                  {event.attendance.in} in · {event.attendance.maybe} maybe
                </p>
              </div>
              <span className="text-sm text-text-muted">
                {event.attendance.out} out
              </span>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">
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
                  onClick={() => void respond(response)}
                >
                  {label}
                </Button>
              ))}
            </div>
            {responseError ? (
              <p className="mt-3 mb-0 text-sm text-danger" role="alert">
                {responseError}
              </p>
            ) : null}
          </div>
          <div className="mt-7">
            <h2 className="m-0 font-display text-xl font-bold text-text">
              Run plans
            </h2>
            <p className="mt-1 mb-0 text-sm text-text-muted">
              Choose the distance and pace that fits your day.
            </p>
            <EventRunOptions
              groups={event.attendance.groups}
              options={event.runOptions}
              response={event.attendance.response}
              selectedRunOptionId={event.attendance.runOptionId}
            />
          </div>
        </div>
      </article>
      {pendingChoice ? (
        <Modal
          description="Choose the plan you want attached to your RSVP."
          onClose={() => setPendingChoice(undefined)}
          title={pendingChoice === 'in' ? "I'm in" : 'Maybe'}
        >
          <div className="grid gap-2">
            {event.runOptions.map((option) => (
              <button
                aria-pressed={selectedRunOptionId === option.id}
                className={`rounded-lg border p-4 text-left transition-colors ${selectedRunOptionId === option.id ? 'border-primary bg-surface-subtle' : 'border-border bg-background'}`}
                key={option.id}
                type="button"
                onClick={() => setSelectedRunOptionId(option.id)}
              >
                <span className="block font-bold text-text">
                  {option.distanceLabel} · {option.paceLabel}
                </span>
                <span className="mt-1 block text-sm text-text-muted">
                  {option.route
                    ? 'Mapped route included'
                    : 'Route details coming later'}
                </span>
              </button>
            ))}
          </div>
          <Button
            className="mt-4 w-full"
            isPending={isResponding}
            pendingLabel="Saving response"
            onClick={() => void confirmChoice()}
          >
            Confirm plan
          </Button>
        </Modal>
      ) : null}
    </section>
  )
}

export function EventDetailLoadingPage() {
  return (
    <section
      className="mx-auto flex min-h-80 w-full max-w-3xl items-center justify-center gap-3 py-12 text-text-muted"
      role="status"
    >
      <PendingIndicator /> Loading event…
    </section>
  )
}

export function EventDetailErrorPage({ onRetry }: { onRetry: () => void }) {
  return (
    <section className="mx-auto w-full max-w-3xl py-12">
      <div
        className="rounded-xl border border-danger bg-surface-subtle p-5"
        role="alert"
      >
        <h1 className="m-0 font-display text-xl font-bold text-text">
          Event unavailable
        </h1>
        <p className="mt-2 mb-0 text-text-muted">
          We could not load this event.
        </p>
        <Button className="mt-4" variant="secondary" onClick={onRetry}>
          Try again
        </Button>
      </div>
    </section>
  )
}

export function EventDetailNotFoundPage({ onBack }: { onBack: () => void }) {
  return (
    <section className="mx-auto w-full max-w-3xl py-12">
      <h1 className="m-0 font-display text-2xl font-bold text-text">
        Event not found
      </h1>
      <p className="mt-2 mb-0 text-text-muted">
        This event may have been canceled or is no longer visible to you.
      </p>
      <Button className="mt-4" variant="secondary" onClick={onBack}>
        Back to events
      </Button>
    </section>
  )
}

export default EventDetailPage
