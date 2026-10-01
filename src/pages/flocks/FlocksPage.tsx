import type { ReactNode } from 'react'

import Button from '@src/primitives/Button'
import PendingIndicator from '@src/primitives/PendingIndicator'
import type { FlockSummary } from '@src/types/flocks'
import FlocksPageContent from './FlocksPageContent'

export type FlocksPageProps = {
  flocks: readonly FlockSummary[]
  isRefreshing: boolean
  onCreate: () => void
  onProfile: () => void
  onSelect: (flockId: string) => void
}

type FlocksErrorPageProps = {
  isRetrying: boolean
  onRetry: () => void
}

function FlocksPageLayout({ children }: { children: ReactNode }) {
  return (
    <section
      aria-labelledby="flocks-heading"
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
          className="m-0 font-display text-3xl font-bold leading-tight tracking-[-0.025em] text-text"
          id="flocks-heading"
        >
          Your flocks
        </h1>
        <p className="mt-2 mb-0 max-w-sm leading-6 text-text-muted">
          Find your group, catch up, and get ready for the next run.
        </p>
      </header>

      <div className="mt-8">{children}</div>
    </section>
  )
}

function FlocksPage({
  flocks,
  isRefreshing,
  onCreate,
  onProfile,
  onSelect,
}: FlocksPageProps) {
  return (
    <FlocksPageLayout>
      <FlocksPageContent
        flocks={flocks}
        isRefreshing={isRefreshing}
        onCreate={onCreate}
        onProfile={onProfile}
        onSelect={onSelect}
      />
    </FlocksPageLayout>
  )
}

export function FlocksLoadingPage() {
  return (
    <FlocksPageLayout>
      <div
        className="flex min-h-32 items-center justify-center gap-3 rounded-lg border border-border bg-surface-subtle px-4 py-8 text-text-muted"
        role="status"
      >
        <PendingIndicator />
        <span>Loading your flocks…</span>
      </div>
    </FlocksPageLayout>
  )
}

export function FlocksErrorPage({ isRetrying, onRetry }: FlocksErrorPageProps) {
  return (
    <FlocksPageLayout>
      <div
        className="min-h-32 rounded-lg border border-accent bg-surface-subtle px-4 py-5"
        role="alert"
      >
        <h2 className="m-0 font-display text-lg font-bold text-text">
          Your flocks are unavailable
        </h2>
        <p className="mt-2 mb-4 leading-6 text-text-muted">
          We could not load your flocks. Check your connection and try again.
        </p>
        <Button
          isPending={isRetrying}
          pendingLabel="Trying again"
          variant="secondary"
          onClick={onRetry}
        >
          Try again
        </Button>
      </div>
    </FlocksPageLayout>
  )
}

export default FlocksPage
