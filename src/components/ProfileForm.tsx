import { useRef, useState, type FormEvent } from 'react'

import Button from '@src/primitives/Button'
import TextField from '@src/primitives/TextField'

export type ProfileFormProps = {
  initialDisplayName: string
  initialLocation: string | null
  isSubmitting?: boolean
  error?: string
  onSubmit: (input: { displayName: string; location: string | null }) => void
}

const maximumDisplayNameLength = 80
const maximumLocationLength = 120

function getDisplayNameError(displayName: string) {
  const normalizedDisplayName = displayName.trim()

  if (!normalizedDisplayName) {
    return 'Enter a display name.'
  }

  if (normalizedDisplayName.length > maximumDisplayNameLength) {
    return `Use ${maximumDisplayNameLength} characters or fewer.`
  }

  return undefined
}

function getLocationError(location: string) {
  if (location.trim().length > maximumLocationLength) {
    return `Use ${maximumLocationLength} characters or fewer.`
  }

  return undefined
}

function ProfileForm({
  error,
  initialDisplayName,
  initialLocation,
  isSubmitting = false,
  onSubmit,
}: ProfileFormProps) {
  const displayNameInputRef = useRef<HTMLInputElement>(null)
  const [displayName, setDisplayName] = useState(initialDisplayName)
  const [location, setLocation] = useState(initialLocation ?? '')
  const [displayNameError, setDisplayNameError] = useState<string>()
  const [locationError, setLocationError] = useState<string>()
  const isDisabled = isSubmitting

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (isDisabled) {
      return
    }

    const nextDisplayNameError = getDisplayNameError(displayName)
    const nextLocationError = getLocationError(location)
    setDisplayNameError(nextDisplayNameError)
    setLocationError(nextLocationError)

    if (nextDisplayNameError || nextLocationError) {
      displayNameInputRef.current?.focus()
      return
    }

    onSubmit({
      displayName: displayName.trim(),
      location: location.trim() || null,
    })
  }

  return (
    <form
      aria-busy={isSubmitting}
      className="w-full"
      noValidate
      onSubmit={handleSubmit}
    >
      <TextField
        autoComplete="name"
        disabled={isDisabled}
        error={displayNameError}
        hint={
          error ? (
            <span className="font-medium text-text" role="alert">
              <span className="text-accent">Error:</span> {error}
            </span>
          ) : (
            `This name is visible to runners in your flocks. ${maximumDisplayNameLength} characters maximum.`
          )
        }
        label="Display name"
        maxLength={maximumDisplayNameLength}
        name="displayName"
        placeholder="Alex Runner"
        ref={displayNameInputRef}
        required
        type="text"
        value={displayName}
        onChange={(event) => {
          const nextDisplayName = event.target.value
          setDisplayName(nextDisplayName)

          if (displayNameError) {
            setDisplayNameError(getDisplayNameError(nextDisplayName))
          }
        }}
      />

      <TextField
        autoComplete="address-level2"
        className="mt-4"
        disabled={isDisabled}
        error={locationError}
        hint={`A city or region helps runners know where you are. Optional. ${maximumLocationLength} characters maximum.`}
        label="Location"
        maxLength={maximumLocationLength}
        name="location"
        placeholder="Portland, Oregon"
        type="text"
        value={location}
        onChange={(event) => {
          const nextLocation = event.target.value
          setLocation(nextLocation)

          if (locationError) {
            setLocationError(getLocationError(nextLocation))
          }
        }}
      />

      <Button
        className="mt-4 w-full"
        isPending={isSubmitting}
        pendingLabel="Saving profile"
        type="submit"
      >
        Save profile
      </Button>
    </form>
  )
}

export default ProfileForm
