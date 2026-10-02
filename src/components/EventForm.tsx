import { useState, type FormEvent } from 'react'
import Button from '@src/primitives/Button'
import TextField from '@src/primitives/TextField'
import type { CreateFlockEventInput } from '@src/types/events'

type EventFormProps = {
  initialValues?: CreateFlockEventInput
  isPending: boolean
  mode: 'create' | 'edit'
  onCancel?: () => void
  onSubmit: (input: CreateFlockEventInput) => void | Promise<void>
  error?: string
}

function EventForm({
  error,
  initialValues,
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

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!title.trim() || !startsAt || !location.trim()) return
    await onSubmit({
      description: description.trim(),
      location: location.trim(),
      startsAt: new Date(startsAt).toISOString(),
      title: title.trim(),
    })
  }

  return (
    <form className="space-y-3" onSubmit={submit}>
      {error ? (
        <p className="m-0 text-sm text-text" role="alert">
          {error}
        </p>
      ) : null}
      <TextField
        label="Title"
        name={`${mode}-event-title`}
        required
        value={title}
        onChange={(event) => setTitle(event.target.value)}
      />
      <TextField
        label="Date and time"
        name={`${mode}-event-startsAt`}
        required
        type="datetime-local"
        value={startsAt}
        onChange={(event) => setStartsAt(event.target.value)}
      />
      <TextField
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
