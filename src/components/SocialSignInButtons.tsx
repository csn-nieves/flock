import Button from '@src/primitives/Button'
import PendingIndicator from '@src/primitives/PendingIndicator'
import FacebookIcon from '@src/primitives/icons/FacebookIcon'
import GoogleIcon from '@src/primitives/icons/GoogleIcon'

type SocialProvider = 'facebook' | 'google'

export type SocialSignInButtonsProps = {
  onFacebookSignIn: () => void
  onGoogleSignIn: () => void
  disabled?: boolean
  pendingProvider?: SocialProvider
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
