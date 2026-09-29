import { useEffect } from 'react'

import { useEmailAuthController } from '@src/auth/useEmailAuthController'
import EmailOtpForm from '@src/components/EmailOtpForm'
import EmailSignInForm from '@src/components/EmailSignInForm'

function SignInPage() {
  const {
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
  } = useEmailAuthController()

  useEffect(() => {
    document.title = 'Sign in — Flock'

    return () => {
      document.title = 'Flock'
    }
  }, [])

  let heading = 'Sign in to Flock'
  let description = 'We will email you a code. No password to remember.'
  let form = (
    <EmailSignInForm
      error={requestError}
      initialEmail={email}
      isSubmitting={isRequesting}
      onSubmit={(nextEmail) => void requestCode(nextEmail)}
    />
  )

  if (step === 'verification') {
    heading = 'Check your email'
    description = 'Enter the six-digit code to keep moving.'
    form = (
      <EmailOtpForm
        email={email}
        error={verificationError}
        isResending={isResending}
        isSubmitting={isVerifying}
        resendAvailableInSeconds={resendAvailableInSeconds}
        resendError={resendError}
        onChangeEmail={changeEmail}
        onResend={() => void resendCode()}
        onSubmit={(code) => void verifyCode(code)}
      />
    )
  }

  return (
    <section
      aria-labelledby="sign-in-heading"
      className="mx-auto flex w-full max-w-sm flex-col py-8 sm:py-12"
    >
      <header className="mb-8">
        <div className="mb-8 flex items-center gap-3">
          <img
            alt=""
            className="size-12 shrink-0 rounded-lg"
            height="48"
            src="/icons/flock-mark.svg"
            width="48"
          />
          <span className="font-display text-xl font-bold tracking-[-0.02em] text-text">
            Flock
          </span>
        </div>

        <h1
          className="m-0 font-display text-3xl font-bold leading-tight tracking-[-0.025em] text-text"
          id="sign-in-heading"
        >
          {heading}
        </h1>
        <p className="mt-2 mb-0 max-w-xs leading-6 text-text-muted">
          {description}
        </p>
      </header>

      {form}
    </section>
  )
}

export default SignInPage
