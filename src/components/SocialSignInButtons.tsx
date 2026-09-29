import Button from '@src/primitives/Button'

type SocialProvider = 'facebook' | 'google'

export type SocialSignInButtonsProps = {
  onFacebookSignIn: () => void
  onGoogleSignIn: () => void
  disabled?: boolean
  pendingProvider?: SocialProvider
}

type ProviderIconProps = {
  className?: string
}

function GoogleIcon({ className }: ProviderIconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      focusable="false"
      viewBox="0 0 24 24"
    >
      <path
        d="M21.6 12.23c0-.71-.06-1.4-.18-2.06H12v3.9h5.38a4.6 4.6 0 0 1-2 3.02v2.53h3.24c1.9-1.75 2.98-4.32 2.98-7.39Z"
        fill="#4285F4"
      />
      <path
        d="M12 22c2.7 0 4.98-.9 6.63-2.43l-3.25-2.52c-.9.6-2.05.96-3.38.96-2.61 0-4.82-1.76-5.61-4.13H3.04v2.6A10 10 0 0 0 12 22Z"
        fill="#34A853"
      />
      <path
        d="M6.39 13.88A6 6 0 0 1 6.08 12c0-.65.11-1.29.31-1.88v-2.6H3.04A10 10 0 0 0 2 12c0 1.61.39 3.14 1.04 4.48l3.35-2.6Z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.99c1.47 0 2.79.5 3.82 1.49l2.88-2.87A9.66 9.66 0 0 0 12 2a10 10 0 0 0-8.96 5.52l3.35 2.6C7.18 7.75 9.39 5.99 12 5.99Z"
        fill="#EA4335"
      />
    </svg>
  )
}

function FacebookIcon({ className }: ProviderIconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      focusable="false"
      viewBox="0 0 24 24"
    >
      <path
        d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.51 1.5-3.9 3.79-3.9 1.1 0 2.25.2 2.25.2v2.47h-1.27c-1.25 0-1.64.78-1.64 1.57V12h2.79l-.45 2.89h-2.34v6.99A10 10 0 0 0 22 12Z"
        fill="#1877F2"
      />
      <path
        d="m15.91 14.89.45-2.89h-2.79v-1.86c0-.79.39-1.57 1.64-1.57h1.27V6.1s-1.15-.2-2.25-.2c-2.29 0-3.79 1.39-3.79 3.9V12H7.9v2.89h2.54v6.99a10.13 10.13 0 0 0 3.13 0v-6.99h2.34Z"
        fill="#FFFFFF"
      />
    </svg>
  )
}

function PendingIndicator() {
  return (
    <span
      aria-hidden="true"
      className="size-4 animate-spin rounded-pill border-2 border-border border-t-text motion-reduce:animate-none"
    />
  )
}

function SocialSignInButtons({
  onFacebookSignIn,
  onGoogleSignIn,
  disabled = false,
  pendingProvider,
}: SocialSignInButtonsProps) {
  const isPending = pendingProvider !== undefined
  const isDisabled = disabled || isPending
  const providerLabel = pendingProvider === 'facebook' ? 'Facebook' : 'Google'

  return (
    <div
      aria-busy={isPending}
      aria-label="Social sign-in options"
      className="grid w-full gap-3"
      role="group"
    >
      <Button
        aria-busy={pendingProvider === 'google'}
        className="relative w-full text-sm font-medium"
        disabled={isDisabled}
        variant="secondary"
        onClick={onGoogleSignIn}
      >
        <GoogleIcon className="absolute left-3 size-5" />
        <span>Continue with Google</span>
        {pendingProvider === 'google' ? (
          <span className="absolute right-3">
            <PendingIndicator />
          </span>
        ) : null}
      </Button>

      <Button
        aria-busy={pendingProvider === 'facebook'}
        className="relative w-full text-sm font-medium"
        disabled={isDisabled}
        variant="secondary"
        onClick={onFacebookSignIn}
      >
        <FacebookIcon className="absolute left-3 size-5" />
        <span>Continue with Facebook</span>
        {pendingProvider === 'facebook' ? (
          <span className="absolute right-3">
            <PendingIndicator />
          </span>
        ) : null}
      </Button>

      {isPending ? (
        <p className="sr-only" role="status">
          Opening {providerLabel} sign-in.
        </p>
      ) : null}
    </div>
  )
}

export default SocialSignInButtons
