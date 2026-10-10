import AuthPageLayout from '@src/components/AuthPageLayout'
import EmailOtpForm from '@src/components/EmailOtpForm'
import EmailSignInForm from '@src/components/EmailSignInForm'
import SocialSignInButtons from '@src/components/SocialSignInButtons'
import Button from '@src/primitives/Button'

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

      <div className="mt-6 border-t border-border pt-5">
        <Button
          className="w-full"
          disabled={emailAuth.isRequesting || demoAuth.isPending}
          isPending={demoAuth.isPending}
          pendingLabel="Opening demo…"
          type="button"
          variant="secondary"
          onClick={demoAuth.startDemo}
        >
          Explore the demo
        </Button>
        <p className="mt-2 mb-0 text-center text-xs leading-4 text-text-muted">
          Browse seeded flocks, events, routes, and chats without creating an
          account.
        </p>
        {demoAuth.error ? (
          <p className="mt-3 mb-0 text-sm leading-5 text-danger" role="alert">
            {demoAuth.error}
          </p>
        ) : null}
      </div>
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
    <AuthPageLayout description={description} heading={heading}>
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
    </AuthPageLayout>
  )
}

export default SignInPage
