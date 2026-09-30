import AuthPageLayout from '@src/components/AuthPageLayout'
import Button from '@src/primitives/Button'
import PendingIndicator from '@src/primitives/PendingIndicator'

type OAuthCallbackErrorPageProps = {
  onReturnToSignIn: () => void
  error?: string
}

export function OAuthCallbackLoadingPage() {
  return (
    <AuthPageLayout
      description="Securely connecting your account…"
      heading="Finishing sign-in"
      isStatus
    >
      <PendingIndicator className="mt-1 size-5" />
    </AuthPageLayout>
  )
}

export function OAuthCallbackSuccessPage() {
  return (
    <AuthPageLayout
      description="Taking you back to where you left off…"
      heading="Sign-in complete"
      isStatus
    />
  )
}

export function OAuthCallbackErrorPage({
  error,
  onReturnToSignIn,
}: OAuthCallbackErrorPageProps) {
  return (
    <AuthPageLayout
      description="Your account was not connected."
      heading="Sign-in did not finish"
    >
      <p
        className="mt-0 mb-6 rounded-md border border-accent bg-surface-subtle px-4 py-3 text-sm leading-5 text-text"
        role="alert"
      >
        {error}
      </p>
      <Button className="w-full" onClick={onReturnToSignIn}>
        Return to sign in
      </Button>
    </AuthPageLayout>
  )
}
