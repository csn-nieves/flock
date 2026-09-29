import { useRef, useState, type FormEvent } from 'react'

import { isValidEmailAddress } from '@src/auth/email'
import Button from '@src/primitives/Button'
import TextField from '@src/primitives/TextField'

export type EmailSignInFormProps = {
  onSubmit: (email: string) => void
  disabled?: boolean
  error?: string
  initialEmail?: string
  isSubmitting?: boolean
}

function getEmailError(email: string) {
  if (!email.trim()) {
    return 'Enter your email address.'
  }

  if (!isValidEmailAddress(email)) {
    return 'Enter a valid email address.'
  }

  return undefined
}

function EmailSignInForm({
  onSubmit,
  disabled = false,
  error,
  initialEmail = '',
  isSubmitting = false,
}: EmailSignInFormProps) {
  const emailInputRef = useRef<HTMLInputElement>(null)
  const [email, setEmail] = useState(initialEmail)
  const [emailError, setEmailError] = useState<string>()

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (disabled || isSubmitting) {
      return
    }

    const nextEmailError = getEmailError(email)
    setEmailError(nextEmailError)

    if (nextEmailError) {
      emailInputRef.current?.focus()
      return
    }

    onSubmit(email.trim())
  }

  return (
    <form
      aria-busy={isSubmitting}
      className="w-full"
      noValidate
      onSubmit={handleSubmit}
    >
      <TextField
        autoComplete="email"
        disabled={disabled || isSubmitting}
        error={emailError}
        hint={
          error ? (
            <span className="font-medium text-text" role="alert">
              <span className="text-accent">Error:</span> {error}
            </span>
          ) : (
            'We will send you a six-digit code.'
          )
        }
        inputMode="email"
        label="Email address"
        name="email"
        placeholder="runner@example.com"
        ref={emailInputRef}
        required
        type="email"
        value={email}
        onChange={(event) => {
          const nextEmail = event.target.value
          setEmail(nextEmail)

          if (emailError) {
            setEmailError(getEmailError(nextEmail))
          }
        }}
      />

      <Button
        className="mt-2 w-full"
        disabled={disabled || isSubmitting}
        type="submit"
      >
        Send code
      </Button>

      {isSubmitting ? (
        <p className="sr-only" role="status">
          Sending code.
        </p>
      ) : null}
    </form>
  )
}

export default EmailSignInForm
