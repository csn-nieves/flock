import AuthPageLayout from '@src/components/AuthPageLayout'
import DemoExperienceCard from '@src/components/DemoExperienceCard'
import EmailOtpForm from '@src/components/EmailOtpForm'
import EmailSignInForm from '@src/components/EmailSignInForm'
import SocialSignInButtons from '@src/components/SocialSignInButtons'
import { Link } from 'react-router'

type EmailAuthPageState = {
  changeEmail: () => void
  email: string
  isRequesting: boolean
  isResending: boolean
  isVerifying: boolean
  requestCode: (email: string) => void
  resendAvailableInSeconds: number
  resendCode: () => void
  step: 'email' | 'verification'
  verifyCode: (code: string) => void
  requestError?: string
  resendError?: string
  verificationError?: string
}

type SocialAuthPageState = {
  signInWithFacebook: () => void
  signInWithGoogle: () => void
  error?: string
  pendingProvider?: 'facebook' | 'google'
}

type DemoAuthPageState = {
  error?: string
  isPending: boolean
  startDemo: () => void
}

export type SignInPageProps = {
  emailAuth: EmailAuthPageState
  demoAuth: DemoAuthPageState
  hasSessionError: boolean
  socialAuth: SocialAuthPageState
}

function SignInPage({
  emailAuth,
  demoAuth,
  hasSessionError,
  socialAuth,
}: SignInPageProps) {
  const isEmailEntry = emailAuth.step === 'email'
  let heading = 'Sign in to Flock'
  let description = 'Choose Google, Facebook, or a six-digit email code.'
  let form = (
    <>
      <SocialSignInButtons
        disabled={emailAuth.isRequesting}
        pendingProvider={socialAuth.pendingProvider}
        onFacebookSignIn={socialAuth.signInWithFacebook}
        onGoogleSignIn={socialAuth.signInWithGoogle}
      />

      <div className="min-h-10 pt-2">
        {socialAuth.error ? (
          <p
            className="m-0 text-sm leading-5 font-medium text-text"
            role="alert"
          >
            <span className="text-accent">Error:</span> {socialAuth.error}
          </p>
        ) : null}
      </div>

      <div className="mb-5 flex items-center gap-3">
        <span aria-hidden="true" className="h-px flex-1 bg-border" />
        <span className="text-sm text-text-muted">or use email</span>
        <span aria-hidden="true" className="h-px flex-1 bg-border" />
      </div>

      <EmailSignInForm
        disabled={socialAuth.pendingProvider !== undefined}
        error={emailAuth.requestError}
        initialEmail={emailAuth.email}
        isSubmitting={emailAuth.isRequesting}
        onSubmit={emailAuth.requestCode}
      />
    </>
  )

  if (emailAuth.step === 'verification') {
    heading = 'Check your email'
    description = 'Enter the six-digit code to keep moving.'
    form = (
      <EmailOtpForm
        email={emailAuth.email}
        error={emailAuth.verificationError}
        isResending={emailAuth.isResending}
        isSubmitting={emailAuth.isVerifying}
        resendAvailableInSeconds={emailAuth.resendAvailableInSeconds}
        resendError={emailAuth.resendError}
        onChangeEmail={emailAuth.changeEmail}
        onResend={emailAuth.resendCode}
        onSubmit={emailAuth.verifyCode}
      />
    )
  }

  return (
    <div
      className={[
        'mx-auto grid w-full max-w-5xl items-center gap-8 px-4 py-8 sm:px-6 sm:py-12',
        isEmailEntry
          ? 'lg:grid-cols-[minmax(0,0.85fr)_minmax(22rem,1fr)] lg:gap-16 lg:py-16'
          : '',
      ].join(' ')}
    >
      <AuthPageLayout
        className="mx-0 max-w-none py-8 sm:py-0"
        description={description}
        heading={heading}
      >
        {hasSessionError ? (
          <p
            className="mt-0 mb-6 rounded-md border border-accent bg-surface-subtle px-4 py-3 text-sm leading-5 text-text"
            role="alert"
          >
            We could not verify whether you are already signed in. You can still
            sign in below.
          </p>
        ) : null}

        {form}

        {isEmailEntry ? (
          <div className="mt-8 lg:hidden">
            <DemoExperienceCard
              error={demoAuth.error}
              isPending={demoAuth.isPending}
              onStart={demoAuth.startDemo}
            />
          </div>
        ) : null}

        <nav
          aria-label="Legal information"
          className="mt-8 flex flex-wrap gap-x-4 gap-y-2 text-sm text-text-muted"
        >
          <Link
            className="underline underline-offset-2 hover:text-text"
            to="/privacy"
          >
            Privacy
          </Link>
          <Link
            className="underline underline-offset-2 hover:text-text"
            to="/data-deletion"
          >
            Request data deletion
          </Link>
        </nav>
      </AuthPageLayout>

      {isEmailEntry ? (
        <div className="hidden lg:block">
          <DemoExperienceCard
            error={demoAuth.error}
            isPending={demoAuth.isPending}
            onStart={demoAuth.startDemo}
          />
        </div>
      ) : null}
    </div>
  )
}

export default SignInPage
