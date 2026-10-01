import type { ReactNode } from 'react'

import Button from '@src/primitives/Button'
import PendingIndicator from '@src/primitives/PendingIndicator'
import type { FlockSummary } from '@src/types/flocks'

export type FlockDetailPageProps = {
  flock: FlockSummary
  isRefreshing: boolean
}

type FlockDetailErrorPageProps = {
  isRetrying: boolean
  onRetry: () => void
}

type FlockDetailPageLayoutProps = {
  children?: ReactNode
  description: string
  heading: string
}

function FlockDetailPageLayout({
  children,
  description,
  heading,
}: FlockDetailPageLayoutProps) {
  return (
    <section
      aria-labelledby="flock-detail-heading"
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
          id="flock-detail-heading"
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

function FlockDetailPage({ flock, isRefreshing }: FlockDetailPageProps) {
  return (
    <FlockDetailPageLayout description="Your run club." heading={flock.name}>
      {isRefreshing ? (
        <p className="sr-only" role="status">
          Refreshing flock…
        </p>
      ) : null}
    </FlockDetailPageLayout>
  )
}

export function FlockDetailLoadingPage() {
  return (
    <FlockDetailPageLayout
      description="Getting your run club ready."
      heading="Flock details"
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

export function FlockDetailNotFoundPage() {
  return (
    <FlockDetailPageLayout
      description="This flock may have been removed, or you may not have access to it."
      heading="Flock not found"
    />
  )
}

export function FlockDetailErrorPage({
  isRetrying,
  onRetry,
}: FlockDetailErrorPageProps) {
  return (
    <FlockDetailPageLayout
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
    </FlockDetailPageLayout>
  )
}

export default FlockDetailPage
