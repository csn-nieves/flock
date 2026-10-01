import Button from '@src/primitives/Button'
import PendingIndicator from '@src/primitives/PendingIndicator'
import { FlockInvitationPageLayout } from './CreateFlockInvitationPage'

type FlockInvitationAcceptanceErrorPageProps = {
  isRetrying: boolean
  onBack: () => void
  onRetry: () => void
}

type FlockInvitationNavigationProps = {
  onBack: () => void
}

export function FlockInvitationJoiningPage({
  onBack,
}: FlockInvitationNavigationProps) {
  return (
    <FlockInvitationPageLayout
      backLabel="Back to your flocks"
      description="Confirming your invitation and adding you to the flock."
      heading="Joining flock"
      onBack={onBack}
    >
      <div
        className="flex min-h-32 items-center justify-center gap-3 rounded-lg border border-border bg-surface-subtle px-4 py-8 text-text-muted"
        role="status"
      >
        <PendingIndicator />
        <span>Joining flock…</span>
      </div>
    </FlockInvitationPageLayout>
  )
}

export function FlockInvitationUnavailablePage({
  onBack,
}: FlockInvitationNavigationProps) {
  return (
    <FlockInvitationPageLayout
      backLabel="Back to your flocks"
      description="This invitation has expired, has already been used, or is not valid. Ask a flock member for a new link."
      heading="Invitation unavailable"
      onBack={onBack}
    />
  )
}

export function FlockInvitationAcceptanceErrorPage({
  isRetrying,
  onBack,
  onRetry,
}: FlockInvitationAcceptanceErrorPageProps) {
  return (
    <FlockInvitationPageLayout
      backLabel="Back to your flocks"
      description="We could not join the flock. Check your connection and try again."
      heading="Could not join flock"
      onBack={onBack}
    >
      <div
        className="rounded-lg border border-accent bg-surface-subtle px-4 py-5"
        role="alert"
      >
        <span className="sr-only">
          We could not join the flock. Check your connection and try again.
        </span>
        <Button
          isPending={isRetrying}
          pendingLabel="Trying again"
          variant="secondary"
          onClick={onRetry}
        >
          Try again
        </Button>
      </div>
    </FlockInvitationPageLayout>
  )
}
