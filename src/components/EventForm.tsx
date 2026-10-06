import { useState, type FormEvent } from 'react'
import Button from '@src/primitives/Button'
import TextField from '@src/primitives/TextField'
import type { EventFormInput } from '@src/types/events'

type EventFormProps = {
  isPending: boolean
  mode: 'create' | 'edit'
  onSubmit: (input: EventFormInput) => void | Promise<void>
  error?: string
  includeRunOptions?: boolean
  initialValues?: EventFormInput
  onCancel?: () => void
}

type EditableRunOption = {
  distanceLabel: string
  key: number
  paceLabel: string
  id?: string
}

let nextRunOptionKey = 0

function newRunOption(
  option?: NonNullable<EventFormInput['runOptions']>[number],
): EditableRunOption {
  nextRunOptionKey += 1
  return {
    distanceLabel: option?.distanceLabel ?? '',
    id: option?.id,
    key: nextRunOptionKey,
    paceLabel: option?.paceLabel ?? '',
  }
}

function EventForm({
  error,
  initialValues,
  includeRunOptions = false,
  isPending,
  mode,
  onCancel,
  onSubmit,
}: EventFormProps) {
  const [title, setTitle] = useState(initialValues?.title ?? '')
  const [startsAt, setStartsAt] = useState(initialValues?.startsAt ?? '')
  const [location, setLocation] = useState(initialValues?.location ?? '')
  const [description, setDescription] = useState(
    initialValues?.description ?? '',
  )
  const [runOptions, setRunOptions] = useState<EditableRunOption[]>(() =>
    initialValues?.runOptions?.length
      ? initialValues.runOptions.map((option) => newRunOption(option))
      : [newRunOption()],
  )
  const [showValidation, setShowValidation] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const hasInvalidRunOption =
      includeRunOptions &&
      runOptions.some(
        (option) => !option.distanceLabel.trim() || !option.paceLabel.trim(),
      )
    if (!title.trim() || !startsAt || !location.trim() || hasInvalidRunOption) {
      setShowValidation(true)
      return
    }
    await onSubmit({
      description: description.trim(),
      location: location.trim(),
      runOptions: includeRunOptions
        ? runOptions.map(({ distanceLabel, id, paceLabel }) => ({
            distanceLabel: distanceLabel.trim(),
            id,
            paceLabel: paceLabel.trim(),
          }))
        : undefined,
      startsAt: new Date(startsAt).toISOString(),
      title: title.trim(),
    })
  }

  return (
    <form noValidate className="space-y-3" onSubmit={submit}>
      {error ? (
        <p className="m-0 text-sm text-text" role="alert">
          {error}
        </p>
      ) : null}
      <TextField
        error={
          showValidation && !title.trim() ? 'Enter an event title.' : undefined
        }
        label="Title"
        name={`${mode}-event-title`}
        required
        value={title}
        onChange={(event) => setTitle(event.target.value)}
      />
      <TextField
        error={
          showValidation && !startsAt ? 'Choose a date and time.' : undefined
        }
        label="Date and time"
        name={`${mode}-event-startsAt`}
        required
        type="datetime-local"
        value={startsAt}
        onChange={(event) => setStartsAt(event.target.value)}
      />
      <TextField
        error={
          showValidation && !location.trim() ? 'Enter a location.' : undefined
        }
        label="Location"
        name={`${mode}-event-location`}
        required
        value={location}
        onChange={(event) => setLocation(event.target.value)}
      />
      <TextField
        label="Description"
        name={`${mode}-event-description`}
        value={description}
        onChange={(event) => setDescription(event.target.value)}
      />
      {includeRunOptions ? (
        <fieldset className="space-y-3 rounded-lg border border-border p-3">
          <legend className="px-1 font-display text-sm font-bold text-text">
            Run options
          </legend>
          <p className="m-0 text-sm leading-5 text-text-muted">
            Add the distances and pace groups runners can join.
          </p>
          {runOptions.map((option, index) => (
            <div className="rounded-lg bg-surface-subtle p-3" key={option.key}>
              <p className="mt-0 mb-2 text-sm font-bold text-text">
                Option {index + 1}
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <TextField
                  error={
                    showValidation && !option.distanceLabel.trim()
                      ? 'Enter a distance.'
                      : undefined
                  }
                  label="Distance"
                  maxLength={40}
                  name={`${mode}-event-distance-${index}`}
                  placeholder="5 miles"
                  required
                  value={option.distanceLabel}
                  onChange={(event) =>
                    setRunOptions((current) =>
                      current.map((item) =>
                        item.key === option.key
                          ? { ...item, distanceLabel: event.target.value }
                          : item,
                      ),
                    )
                  }
                />
                <TextField
                  error={
                    showValidation && !option.paceLabel.trim()
                      ? 'Enter a pace.'
                      : undefined
                  }
                  label="Pace"
                  maxLength={60}
                  name={`${mode}-event-pace-${index}`}
                  placeholder="Conversational"
                  required
                  value={option.paceLabel}
                  onChange={(event) =>
                    setRunOptions((current) =>
                      current.map((item) =>
                        item.key === option.key
                          ? { ...item, paceLabel: event.target.value }
                          : item,
                      ),
                    )
                  }
                />
              </div>
              {runOptions.length > 1 ? (
                <Button
                  className="mt-2"
                  type="button"
                  variant="secondary"
                  onClick={() =>
                    setRunOptions((current) =>
                      current.filter((item) => item.key !== option.key),
                    )
                  }
                >
                  Remove option
                </Button>
              ) : null}
            </div>
          ))}
          {runOptions.length < 8 ? (
            <Button
              type="button"
              variant="secondary"
              onClick={() =>
                setRunOptions((current) => [...current, newRunOption()])
              }
            >
              Add another option
            </Button>
          ) : null}
        </fieldset>
      ) : null}
      <div className="grid gap-2 sm:flex sm:flex-row-reverse">
        <Button
          className="w-full sm:w-auto"
          isPending={isPending}
          pendingLabel={mode === 'create' ? 'Creating event' : 'Saving event'}
          type="submit"
        >
          {mode === 'create' ? 'Create event' : 'Save event'}
        </Button>
        {onCancel ? (
          <Button
            className="w-full sm:w-auto"
            type="button"
            variant="secondary"
            onClick={onCancel}
          >
            Cancel
          </Button>
        ) : null}
      </div>
    </form>
  )
}

export default EventForm
