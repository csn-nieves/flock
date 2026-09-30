import { useRef, useState, type FormEvent } from 'react'

import Button from '@src/primitives/Button'
import TextField from '@src/primitives/TextField'

export type CreateFlockFormProps = {
  onSubmit: (name: string) => void
  disabled?: boolean
  error?: string
  initialName?: string
  isSubmitting?: boolean
}

const maximumNameLength = 80

function getNameError(name: string) {
  const normalizedName = name.trim()

  if (!normalizedName) {
    return 'Enter a flock name.'
  }

  if (normalizedName.length > maximumNameLength) {
    return `Use ${maximumNameLength} characters or fewer.`
  }

  return undefined
}

function CreateFlockForm({
  onSubmit,
  disabled = false,
  error,
  initialName = '',
  isSubmitting = false,
}: CreateFlockFormProps) {
  const nameInputRef = useRef<HTMLInputElement>(null)
  const [name, setName] = useState(initialName)
  const [nameError, setNameError] = useState<string>()
  const isDisabled = disabled || isSubmitting

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (isDisabled) {
      return
    }

    const nextNameError = getNameError(name)
    setNameError(nextNameError)

    if (nextNameError) {
      nameInputRef.current?.focus()
      return
    }

    onSubmit(name.trim())
  }

  return (
    <form
      aria-busy={isSubmitting}
      className="w-full"
      noValidate
      onSubmit={handleSubmit}
    >
      <TextField
        autoComplete="organization"
        disabled={isDisabled}
        error={nameError}
        hint={
          error ? (
            <span className="font-medium text-text" role="alert">
              <span className="text-accent">Error:</span> {error}
            </span>
          ) : (
            `Choose a name runners will recognize. ${maximumNameLength} characters maximum.`
          )
        }
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
            setNameError(getNameError(nextName))
          }
        }}
      />

      <Button className="mt-4 w-full" disabled={isDisabled} type="submit">
        Create flock
      </Button>

      {isSubmitting ? (
        <p className="sr-only" role="status">
          Creating flock.
        </p>
      ) : null}
    </form>
  )
}

export default CreateFlockForm
