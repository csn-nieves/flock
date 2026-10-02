import type { ReactNode } from 'react'

import PageBackButton from '@src/components/PageBackButton'
import FlockSectionNav from '@src/components/FlockSectionNav'
import Button from '@src/primitives/Button'
import PendingIndicator from '@src/primitives/PendingIndicator'
import type { FlockSummary } from '@src/types/flocks'
import FlockMembersSection, {
  type FlockMemberListState,
} from './FlockMembersSection'
import FlockEventsSection, {
  type FlockEventsSectionProps,
} from './FlockEventsSection'

export type FlockDetailPageProps = {
  flock: FlockSummary
  isRefreshing: boolean
  memberList: FlockMemberListState
  onBack: () => void
  onInvite: () => void
  onRetryMembers: () => void
  events?: FlockEventsSectionProps
}

type FlockDetailErrorPageProps = {
  isRetrying: boolean
  onBack: () => void
  onRetry: () => void
}

type FlockDetailPageLayoutProps = {
  children?: ReactNode
  description: string
  heading: string
  onBack: () => void
}

function FlockDetailPageLayout({
  children,
  description,
  heading,
  onBack,
}: FlockDetailPageLayoutProps) {
  return (
    <section
      aria-labelledby="flock-detail-heading"
      className="relative mx-auto w-full max-w-xl py-8 sm:py-12"
    >
      <PageBackButton label="Back to your flocks" onBack={onBack} />

      <header>
        <h1
          className="m-0 font-display text-3xl leading-tight font-bold tracking-[-0.025em] text-text"
          id="flock-detail-heading"
        >
          {heading}
        </h1>
        <p className="mt-6 mb-0 max-w-sm leading-6 text-text-muted">
          {description}
        </p>
      </header>

      {children ? <div className="mt-8">{children}</div> : null}
    </section>
  )
}

function FlockDetailPage({
  flock,
  isRefreshing,
  memberList,
  onBack,
  onInvite,
  onRetryMembers,
  events,
}: FlockDetailPageProps) {
  return (
    <FlockDetailPageLayout
      description="Your run club."
      heading={flock.name}
      onBack={onBack}
    >
      <div id="flock-overview">
        <FlockSectionNav />
      </div>
      <Button className="w-full" onClick={onInvite}>
        Invite a runner
      </Button>
      {isRefreshing ? (
        <p className="sr-only" role="status">
          Refreshing flock…
        </p>
      ) : null}
      <FlockMembersSection memberList={memberList} onRetry={onRetryMembers} />
      {events ? <FlockEventsSection {...events} /> : null}
    </FlockDetailPageLayout>
  )
}

export function FlockDetailLoadingPage({ onBack }: { onBack: () => void }) {
  return (
    <FlockDetailPageLayout
      description="Getting your run club ready."
      heading="Flock details"
      onBack={onBack}
    >
      <div
        className="flex min-h-32 items-center justify-center gap-3 rounded-lg border border-border bg-surface-subtle px-4 py-8 text-text-muted"
        role="status"
      >
        <PendingIndicator />
        <span>Loading flock…</span>
      </div>
    </FlockDetailPageLayout>
  )
}

export function FlockDetailNotFoundPage({ onBack }: { onBack: () => void }) {
  return (
    <FlockDetailPageLayout
      description="This flock may have been removed, or you may not have access to it."
      heading="Flock not found"
      onBack={onBack}
    />
  )
}

export function FlockDetailErrorPage({
  isRetrying,
  onBack,
  onRetry,
}: FlockDetailErrorPageProps) {
  return (
    <FlockDetailPageLayout
      description="We could not load this flock. Check your connection and try again."
      heading="Flock unavailable"
      onBack={onBack}
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
    </FlockDetailPageLayout>
  )
}

export default FlockDetailPage
