import { useRef, useState, type FormEvent } from 'react'

import Button from '@src/primitives/Button'
import TextField from '@src/primitives/TextField'

export type ProfileFormProps = {
  initialDisplayName: string
  isSubmitting?: boolean
  error?: string
  onSubmit: (displayName: string) => void
}

const maximumDisplayNameLength = 80

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

function ProfileForm({
  error,
  initialDisplayName,
  isSubmitting = false,
  onSubmit,
}: ProfileFormProps) {
  const displayNameInputRef = useRef<HTMLInputElement>(null)
  const [displayName, setDisplayName] = useState(initialDisplayName)
  const [displayNameError, setDisplayNameError] = useState<string>()
  const isDisabled = isSubmitting

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (isDisabled) {
      return
    }

    const nextDisplayNameError = getDisplayNameError(displayName)
    setDisplayNameError(nextDisplayNameError)

    if (nextDisplayNameError) {
      displayNameInputRef.current?.focus()
      return
    }

    onSubmit(displayName.trim())
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
