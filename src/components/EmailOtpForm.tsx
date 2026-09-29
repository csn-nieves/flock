import { useRef, useState, type FormEvent } from 'react'

import { isValidEmailOtp } from '@src/auth/email'
import Button from '@src/primitives/Button'
import TextField from '@src/primitives/TextField'

export type EmailOtpFormProps = {
  email: string
  onChangeEmail: () => void
  onSubmit: (code: string) => void
  error?: string
  initialCode?: string
  isSubmitting?: boolean
}

function getCodeError(code: string) {
  if (!code.trim()) {
    return 'Enter the six-digit code.'
  }

  if (!isValidEmailOtp(code)) {
    return 'Enter all six digits from your email.'
  }

  return undefined
}

function EmailOtpForm({
  email,
  onChangeEmail,
  onSubmit,
  error,
  initialCode = '',
  isSubmitting = false,
}: EmailOtpFormProps) {
  const codeInputRef = useRef<HTMLInputElement>(null)
  const [code, setCode] = useState(initialCode)
  const [codeError, setCodeError] = useState<string>()

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (isSubmitting) {
      return
    }

    const nextCodeError = getCodeError(code)
    setCodeError(nextCodeError)

    if (nextCodeError) {
      codeInputRef.current?.focus()
      return
    }

    onSubmit(code.trim())
  }

  return (
    <form
      aria-busy={isSubmitting}
      className="w-full"
      noValidate
      onSubmit={handleSubmit}
    >
      <div className="mb-5">
        <p className="m-0 text-sm leading-5 text-text-muted">Code sent to</p>
        <p className="m-0 break-all font-bold leading-6 text-text">{email}</p>
        <Button
          className="mt-2 w-full"
          disabled={isSubmitting}
          variant="secondary"
          onClick={onChangeEmail}
        >
          Change email
        </Button>
      </div>

      <TextField
        autoComplete="one-time-code"
        disabled={isSubmitting}
        error={codeError}
        hint={
          error ? (
            <span className="font-medium text-text" role="alert">
              <span className="text-accent">Error:</span> {error}
            </span>
          ) : (
            'Enter the code from your email.'
          )
        }
        inputMode="numeric"
        label="Six-digit code"
        maxLength={6}
        minLength={6}
        name="code"
        pattern="[0-9]{6}"
        placeholder="123456"
        ref={codeInputRef}
        required
        type="text"
        value={code}
        onChange={(event) => {
          const nextCode = event.target.value
          setCode(nextCode)

          if (codeError) {
            setCodeError(getCodeError(nextCode))
          }
        }}
      />

      <Button className="mt-4 w-full" disabled={isSubmitting} type="submit">
        Verify code
      </Button>

      {isSubmitting ? (
        <p className="sr-only" role="status">
          Verifying code.
        </p>
      ) : null}
    </form>
  )
}

export default EmailOtpForm
