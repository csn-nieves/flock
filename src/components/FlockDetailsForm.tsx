import { useRef, useState, type FormEvent } from 'react'

import Button from '@src/primitives/Button'
import TextAreaField from '@src/primitives/TextAreaField'
import TextField from '@src/primitives/TextField'
import type { FlockDetailsInput } from '@src/types/flocks'

export type FlockDetailsFormProps = {
  mode: 'create' | 'edit'
  onSubmit: (input: FlockDetailsInput) => void
  disabled?: boolean
  error?: string
  initialValues?: FlockDetailsInput
  isSubmitting?: boolean
  onCancel?: () => void
}

const maximumNameLength = 80
const maximumLocationLength = 120
const maximumDescriptionLength = 240

function getRequiredError(value: string, label: string, maximumLength: number) {
  const normalizedValue = value.trim()

  if (!normalizedValue) {
    return `Enter ${label}.`
  }

  if (normalizedValue.length > maximumLength) {
    return `Use ${maximumLength} characters or fewer.`
  }

  return undefined
}

function FlockDetailsForm({
  disabled = false,
  error,
  initialValues,
  isSubmitting = false,
  mode,
  onCancel,
  onSubmit,
}: FlockDetailsFormProps) {
  const nameInputRef = useRef<HTMLInputElement>(null)
  const locationInputRef = useRef<HTMLInputElement>(null)
  const descriptionInputRef = useRef<HTMLTextAreaElement>(null)
  const [name, setName] = useState(initialValues?.name ?? '')
  const [location, setLocation] = useState(initialValues?.location ?? '')
  const [description, setDescription] = useState(
    initialValues?.description ?? '',
  )
  const [nameError, setNameError] = useState<string>()
  const [locationError, setLocationError] = useState<string>()
  const [descriptionError, setDescriptionError] = useState<string>()
  const isDisabled = disabled || isSubmitting

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (isDisabled) {
      return
    }

    const nextNameError = getRequiredError(
      name,
      'a flock name',
      maximumNameLength,
    )
    const nextLocationError = getRequiredError(
      location,
      'a location',
      maximumLocationLength,
    )
    const nextDescriptionError = getRequiredError(
      description,
      'a short description',
      maximumDescriptionLength,
    )
    setNameError(nextNameError)
    setLocationError(nextLocationError)
    setDescriptionError(nextDescriptionError)

    if (nextNameError) {
      nameInputRef.current?.focus()
      return
    }

    if (nextLocationError) {
      locationInputRef.current?.focus()
      return
    }

    if (nextDescriptionError) {
      descriptionInputRef.current?.focus()
      return
    }

    onSubmit({
      description: description.trim(),
      location: location.trim(),
      name: name.trim(),
    })
  }

  const actionLabel = mode === 'create' ? 'Create flock' : 'Save changes'
  const pendingLabel = mode === 'create' ? 'Creating flock' : 'Saving changes'

  return (
    <form
      aria-busy={isSubmitting}
      className="w-full"
      noValidate
      onSubmit={handleSubmit}
    >
      {error ? (
        <p
          className="mb-4 rounded-md border border-accent bg-surface-subtle px-4 py-3 text-sm leading-5 text-text"
          role="alert"
        >
          <span className="font-bold">Could not save:</span> {error}
        </p>
      ) : null}

      <TextField
        autoComplete="organization"
        disabled={isDisabled}
        error={nameError}
        hint={`Choose a name runners will recognize. ${maximumNameLength} characters maximum.`}
        label="Flock name"
        maxLength={maximumNameLength}
        name="flockName"
        placeholder="Sunrise Striders"
        ref={nameInputRef}
        required
        type="text"
        value={name}
        onChange={(event) => {
          const nextName = event.target.value
          setName(nextName)

          if (nameError) {
            setNameError(
              getRequiredError(nextName, 'a flock name', maximumNameLength),
            )
          }
        }}
      />

      <TextField
        autoComplete="address-level2"
        className="mt-4"
        disabled={isDisabled}
        error={locationError}
        hint={`Use a city, neighborhood, or regular meeting area. ${maximumLocationLength} characters maximum.`}
        label="Location"
        maxLength={maximumLocationLength}
        name="flockLocation"
        placeholder="Portland, Oregon"
        ref={locationInputRef}
        required
        type="text"
        value={location}
        onChange={(event) => {
          const nextLocation = event.target.value
          setLocation(nextLocation)

          if (locationError) {
            setLocationError(
              getRequiredError(
                nextLocation,
                'a location',
                maximumLocationLength,
              ),
            )
          }
        }}
      />

      <TextAreaField
        className="mt-4"
        disabled={isDisabled}
        error={descriptionError}
        hint={`Tell runners what kind of group this is. ${maximumDescriptionLength} characters maximum.`}
        label="Description"
        maxLength={maximumDescriptionLength}
        name="flockDescription"
        placeholder="Friendly weekday miles for every pace."
        ref={descriptionInputRef}
        required
        rows={4}
        value={description}
        onChange={(event) => {
          const nextDescription = event.target.value
          setDescription(nextDescription)

          if (descriptionError) {
            setDescriptionError(
              getRequiredError(
                nextDescription,
                'a short description',
                maximumDescriptionLength,
              ),
            )
          }
        }}
      />

      <div className="mt-4 grid gap-2 sm:flex sm:flex-row-reverse">
        <Button
          className="w-full sm:w-auto"
          disabled={disabled}
          isPending={isSubmitting}
          pendingLabel={pendingLabel}
          type="submit"
        >
          {actionLabel}
        </Button>
        {onCancel ? (
          <Button
            className="w-full sm:w-auto"
            disabled={isDisabled}
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

export default FlockDetailsForm
