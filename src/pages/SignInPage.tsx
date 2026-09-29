import { useEffect, useRef, type ReactNode } from 'react'
import { useNavigate } from 'react-router'

import { consumeAuthDestination } from '@src/auth/destination'
import EmailOtpForm from '@src/components/EmailOtpForm'
import EmailSignInForm from '@src/components/EmailSignInForm'
import { useAuthSession } from '@src/hooks/useAuthSession'
import { useEmailAuthController } from '@src/hooks/useEmailAuthController'

type SignInPageLayoutProps = {
  children?: ReactNode
  description: string
  heading: string
  isStatus?: boolean
}

function SignInPageLayout({
  children,
  description,
  heading,
  isStatus = false,
}: SignInPageLayoutProps) {
  const descriptionRole = isStatus ? 'status' : undefined

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
        <p
          className="mt-2 mb-0 max-w-xs leading-6 text-text-muted"
          role={descriptionRole}
        >
          {description}
        </p>
      </header>

      {children}
    </section>
  )
}

type EmailSignInWorkflowProps = {
  hasSessionError: boolean
}

function EmailSignInWorkflow({ hasSessionError }: EmailSignInWorkflowProps) {
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
    <SignInPageLayout description={description} heading={heading}>
      {hasSessionError && (
        <p
          className="mt-0 mb-6 rounded-md border border-accent bg-surface-subtle px-4 py-3 text-sm leading-5 text-text"
          role="alert"
        >
          We could not verify whether you are already signed in. You can still
          sign in below.
        </p>
      )}

      {form}
    </SignInPageLayout>
  )
}

function SignInPage() {
  const { error, isLoading, session } = useAuthSession()
  const hasRedirectedRef = useRef(false)
  const navigate = useNavigate()
  let title = 'Sign in — Flock'

  if (isLoading) {
    title = 'Loading… — Flock'
  } else if (session) {
    title = 'Returning… — Flock'
  }

  useEffect(() => {
    document.title = title

    return () => {
      document.title = 'Flock'
    }
  }, [title])

  useEffect(() => {
    if (isLoading || !session || hasRedirectedRef.current) {
      return
    }

    hasRedirectedRef.current = true
    navigate(consumeAuthDestination(), { replace: true })
  }, [isLoading, navigate, session])

  if (isLoading) {
    return (
      <SignInPageLayout
        description="Checking your session…"
        heading="Getting Flock ready"
        isStatus
      />
    )
  }

  if (session) {
    return (
      <SignInPageLayout
        description="Taking you back to where you left off…"
        heading="Returning you to Flock"
        isStatus
      />
    )
  }

  return <EmailSignInWorkflow hasSessionError={Boolean(error)} />
}

export default SignInPage
