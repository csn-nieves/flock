import AuthPageLayout from '@src/components/AuthPageLayout'
import EmailOtpForm from '@src/components/EmailOtpForm'
import EmailSignInForm from '@src/components/EmailSignInForm'
import SocialSignInButtons from '@src/components/SocialSignInButtons'

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

export type SignInPageProps = {
  emailAuth: EmailAuthPageState
  hasSessionError: boolean
  socialAuth: SocialAuthPageState
}

function SignInPage({
  emailAuth,
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
