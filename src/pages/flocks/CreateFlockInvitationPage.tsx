import type { ReactNode } from 'react'

import Button from '@src/primitives/Button'
import PendingIndicator from '@src/primitives/PendingIndicator'
import type { FlockSummary } from '@src/types/flocks'
import type { FlockInvitationLink } from '@src/types/invitations'
import InvitationLinkCard, {
  type ShareInvitationResult,
} from './InvitationLinkCard'

export type CreateFlockInvitationPageProps = {
  emailHref: string
  flock: FlockSummary
  isCreating: boolean
  onCopy: (invitationUrl: string) => Promise<void>
  onCreate: () => void
  error?: string
  invitation?: FlockInvitationLink
  onShare?: (invitationUrl: string) => Promise<ShareInvitationResult>
}

type FlockInvitationErrorPageProps = {
  isRetrying: boolean
  onRetry: () => void
}

type FlockInvitationPageLayoutProps = {
  children?: ReactNode
  description: string
  heading: string
}

export function FlockInvitationPageLayout({
  children,
  description,
  heading,
}: FlockInvitationPageLayoutProps) {
  return (
    <section
      aria-labelledby="flock-invitation-heading"
      className="mx-auto w-full py-8 sm:py-12"
    >
      <header>
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
          className="m-0 font-display text-3xl leading-tight font-bold tracking-[-0.025em] text-text"
          id="flock-invitation-heading"
        >
          {heading}
        </h1>
        <p className="mt-2 mb-0 max-w-sm leading-6 text-text-muted">
          {description}
        </p>
      </header>

      {children ? <div className="mt-8">{children}</div> : null}
    </section>
  )
}

function CreateFlockInvitationPage({
  emailHref,
  error,
  flock,
  invitation,
  isCreating,
  onCopy,
  onCreate,
  onShare,
}: CreateFlockInvitationPageProps) {
  return (
    <FlockInvitationPageLayout
      description={`Create a single-use link that takes one runner straight to ${flock.name}.`}
      heading="Invite a runner"
    >
      {invitation ? (
        <InvitationLinkCard
          emailHref={emailHref}
          invitationUrl={invitation.url}
          onCopy={onCopy}
          onShare={onShare}
        />
      ) : (
        <div>
          <p className="mt-0 min-h-6 text-sm leading-5 text-text">
            {error ? (
              <span className="font-medium" role="alert">
                <span className="text-accent">Error:</span> {error}
              </span>
            ) : (
              'The link expires after 24 hours or as soon as it is used.'
            )}
          </p>
          <Button
            className="mt-4 w-full"
            isPending={isCreating}
            pendingLabel="Creating invitation"
            onClick={onCreate}
          >
            Create invitation link
          </Button>
        </div>
      )}
    </FlockInvitationPageLayout>
  )
}

export function FlockInvitationLoadingPage() {
  return (
    <FlockInvitationPageLayout
      description="Getting the flock ready to share."
      heading="Invite a runner"
    >
      <div
        className="flex min-h-32 items-center justify-center gap-3 rounded-lg border border-border bg-surface-subtle px-4 py-8 text-text-muted"
        role="status"
      >
        <PendingIndicator />
        <span>Loading flock…</span>
      </div>
    </FlockInvitationPageLayout>
  )
}

export function FlockInvitationNotFoundPage() {
  return (
    <FlockInvitationPageLayout
      description="This flock may have been removed, or you may not have access to it."
      heading="Flock not found"
    />
  )
}

export function FlockInvitationErrorPage({
  isRetrying,
  onRetry,
}: FlockInvitationErrorPageProps) {
  return (
    <FlockInvitationPageLayout
      description="We could not load this flock. Check your connection and try again."
      heading="Flock unavailable"
    >
      <div
        className="rounded-lg border border-accent bg-surface-subtle px-4 py-5"
        role="alert"
      >
        <span className="sr-only">
          We could not load this flock. Check your connection and try again.
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

export default CreateFlockInvitationPage
