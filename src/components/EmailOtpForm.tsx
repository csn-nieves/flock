import { useId, useRef, useState, type FormEvent } from 'react'

import { isValidEmailOtp } from '@src/auth/email'
import Button from '@src/primitives/Button'
import TextField from '@src/primitives/TextField'

export type EmailOtpFormProps = {
  email: string
  onChangeEmail: () => void
  onResend: () => void
  onSubmit: (code: string) => void
  error?: string
  initialCode?: string
  isResending?: boolean
  isSubmitting?: boolean
  resendAvailableInSeconds?: number
  resendError?: string
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
  onResend,
  onSubmit,
  error,
  initialCode = '',
  isResending = false,
  isSubmitting = false,
  resendAvailableInSeconds = 0,
  resendError,
}: EmailOtpFormProps) {
  const resendStatusId = useId()
  const codeInputRef = useRef<HTMLInputElement>(null)
  const [code, setCode] = useState(initialCode)
  const [codeError, setCodeError] = useState<string>()
  const resendWaitSeconds = Math.max(0, Math.ceil(resendAvailableInSeconds))
  const isBusy = isSubmitting || isResending
  const canResend = !isBusy && resendWaitSeconds === 0
  const hasResendStatus =
    isResending || Boolean(resendError) || resendWaitSeconds > 0

  let resendStatus = null

  if (isResending) {
    resendStatus = (
      <p className="m-0 text-text-muted" role="status">
        Sending another code.
      </p>
    )
  } else if (resendError) {
    resendStatus = (
      <p className="m-0 font-medium text-text" role="alert">
        <span className="text-accent">Error:</span> {resendError}
      </p>
    )
  } else if (resendWaitSeconds > 0) {
    resendStatus = (
      <p className="m-0 text-text-muted">
        You can request another code in {resendWaitSeconds}{' '}
        {resendWaitSeconds === 1 ? 'second' : 'seconds'}.
      </p>
    )
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (isBusy) {
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
      aria-busy={isBusy}
      className="w-full"
      noValidate
      onSubmit={handleSubmit}
    >
      <div className="mb-5">
        <p className="m-0 text-sm leading-5 text-text-muted">Code sent to</p>
        <p className="m-0 break-all font-bold leading-6 text-text">{email}</p>
        <Button
          className="mt-2 w-full"
          disabled={isBusy}
          variant="secondary"
          onClick={onChangeEmail}
        >
          Change email
        </Button>
      </div>

      <TextField
        autoComplete="one-time-code"
        disabled={isBusy}
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

      <Button className="mt-4 w-full" disabled={isBusy} type="submit">
        Verify code
      </Button>

      <Button
        aria-describedby={hasResendStatus ? resendStatusId : undefined}
        className="mt-3 w-full"
        disabled={!canResend}
        type="button"
        variant="secondary"
        onClick={onResend}
      >
        Send another code
      </Button>

      <div className="min-h-6 pt-2 text-sm leading-4" id={resendStatusId}>
        {resendStatus}
      </div>

      {isSubmitting ? (
        <p className="sr-only" role="status">
          Verifying code.
        </p>
      ) : null}
    </form>
  )
}

export default EmailOtpForm
