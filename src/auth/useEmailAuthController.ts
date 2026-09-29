import { useEffect, useRef, useState } from 'react'

import { requestEmailOtp, verifyEmailOtp } from '@src/data/auth'

const DEFAULT_RESEND_COOLDOWN_SECONDS = 60

export type EmailAuthStep = 'email' | 'verification'

type UseEmailAuthControllerOptions = {
  resendCooldownSeconds?: number
}

function getErrorCode(error: unknown) {
  if (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof error.code === 'string'
  ) {
    return error.code
  }

  return undefined
}

function isRateLimitError(error: unknown) {
  const code = getErrorCode(error)

  if (
    code === 'over_email_send_rate_limit' ||
    code === 'over_request_rate_limit'
  ) {
    return true
  }

  return (
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    error.status === 429
  )
}

function isNetworkError(error: unknown) {
  return error instanceof TypeError || getErrorCode(error) === 'request_timeout'
}

function getRequestError(error: unknown) {
  if (isRateLimitError(error)) {
    return 'Too many codes requested. Wait a moment and try again.'
  }

  if (isNetworkError(error)) {
    return 'We could not send a code. Check your connection and try again.'
  }

  return 'We could not send a code. Try again.'
}

function getVerificationError(error: unknown) {
  const code = getErrorCode(error)

  if (code === 'otp_expired' || code === 'invalid_credentials') {
    return 'That code is invalid or has expired. Check the code and try again.'
  }

  if (isNetworkError(error)) {
    return 'We could not verify that code. Check your connection and try again.'
  }

  return 'We could not verify that code. Try again.'
}

function getResendError(error: unknown) {
  if (isRateLimitError(error)) {
    return 'Another code cannot be sent yet. Wait a moment and try again.'
  }

  if (isNetworkError(error)) {
    return 'We could not send another code. Check your connection and try again.'
  }

  return 'We could not send another code. Try again.'
}

export function useEmailAuthController({
  resendCooldownSeconds = DEFAULT_RESEND_COOLDOWN_SECONDS,
}: UseEmailAuthControllerOptions = {}) {
  const cooldownSeconds = Math.max(0, Math.ceil(resendCooldownSeconds))
  const isMountedRef = useRef(true)
  const isRequestActiveRef = useRef(false)
  const resendAvailableAtRef = useRef<number | null>(null)
  const [step, setStep] = useState<EmailAuthStep>('email')
  const [email, setEmail] = useState('')
  const [requestError, setRequestError] = useState<string>()
  const [verificationError, setVerificationError] = useState<string>()
  const [resendError, setResendError] = useState<string>()
  const [isRequesting, setIsRequesting] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [resendAvailableInSeconds, setResendAvailableInSeconds] = useState(0)

  useEffect(() => {
    isMountedRef.current = true

    return () => {
      isMountedRef.current = false
    }
  }, [])

  useEffect(() => {
    if (resendAvailableInSeconds === 0) {
      return
    }

    const timer = window.setTimeout(() => {
      const resendAvailableAt = resendAvailableAtRef.current

      if (resendAvailableAt === null) {
        setResendAvailableInSeconds(0)
        return
      }

      const remainingSeconds = Math.max(
        0,
        Math.ceil((resendAvailableAt - Date.now()) / 1000),
      )
      setResendAvailableInSeconds(remainingSeconds)
    }, 1000)

    return () => window.clearTimeout(timer)
  }, [resendAvailableInSeconds])

  function startResendCooldown() {
    resendAvailableAtRef.current = Date.now() + cooldownSeconds * 1000
    setResendAvailableInSeconds(cooldownSeconds)
  }

  async function requestCode(nextEmail: string) {
    if (isRequestActiveRef.current) {
      return
    }

    const normalizedEmail = nextEmail.trim()
    isRequestActiveRef.current = true
    setIsRequesting(true)
    setRequestError(undefined)

    try {
      const response = await requestEmailOtp(normalizedEmail)

      if (!isMountedRef.current) {
        return
      }

      if (response.error) {
        setRequestError(getRequestError(response.error))
        return
      }

      setEmail(normalizedEmail)
      setStep('verification')
      setVerificationError(undefined)
      setResendError(undefined)
      startResendCooldown()
    } catch (error) {
      if (isMountedRef.current) {
        setRequestError(getRequestError(error))
      }
    } finally {
      isRequestActiveRef.current = false

      if (isMountedRef.current) {
        setIsRequesting(false)
      }
    }
  }

  async function verifyCode(code: string) {
    if (isRequestActiveRef.current || !email) {
      return
    }

    isRequestActiveRef.current = true
    setIsVerifying(true)
    setVerificationError(undefined)

    try {
      const response = await verifyEmailOtp({ email, token: code })

      if (isMountedRef.current && response.error) {
        setVerificationError(getVerificationError(response.error))
      }
    } catch (error) {
      if (isMountedRef.current) {
        setVerificationError(getVerificationError(error))
      }
    } finally {
      isRequestActiveRef.current = false

      if (isMountedRef.current) {
        setIsVerifying(false)
      }
    }
  }

  async function resendCode() {
    if (isRequestActiveRef.current || !email || resendAvailableInSeconds > 0) {
      return
    }

    isRequestActiveRef.current = true
    setIsResending(true)
    setResendError(undefined)

    try {
      const response = await requestEmailOtp(email)

      if (!isMountedRef.current) {
        return
      }

      if (response.error) {
        setResendError(getResendError(response.error))
        return
      }

      setVerificationError(undefined)
      startResendCooldown()
    } catch (error) {
      if (isMountedRef.current) {
        setResendError(getResendError(error))
      }
    } finally {
      isRequestActiveRef.current = false

      if (isMountedRef.current) {
        setIsResending(false)
      }
    }
  }

  function changeEmail() {
    if (isRequestActiveRef.current) {
      return
    }

    resendAvailableAtRef.current = null
    setStep('email')
    setRequestError(undefined)
    setVerificationError(undefined)
    setResendError(undefined)
    setResendAvailableInSeconds(0)
  }

  return {
    changeEmail,
    email,
    isRequesting,
    isResending,
    isVerifying,
    requestCode,
    requestError,
    resendAvailableInSeconds,
    resendCode,
    resendError,
    step,
    verificationError,
    verifyCode,
  }
}
