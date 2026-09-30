import FlockList from '@src/components/FlockList'
import type { FlockSummary } from '@src/data/flocks'
import Button from '@src/primitives/Button'
import PendingIndicator from '@src/primitives/PendingIndicator'

export type FlocksPageState =
  | {
      status: 'loading'
    }
  | {
      isRetrying: boolean
      status: 'error'
    }
  | {
      flocks: readonly FlockSummary[]
      isRefreshing: boolean
      status: 'success'
    }

type FlocksPageContentProps = {
  state: FlocksPageState
  onCreate: () => void
  onRetry: () => void
  onSelect: (flockId: string) => void
}

type FlocksErrorProps = {
  isRetrying: boolean
  onRetry: () => void
}

type EmptyFlocksProps = {
  onCreate: () => void
}

type PopulatedFlocksProps = {
  flocks: readonly FlockSummary[]
  isRefreshing: boolean
  onCreate: () => void
  onSelect: (flockId: string) => void
}

function LoadingFlocks() {
  return (
    <div
      className="flex min-h-32 items-center justify-center gap-3 rounded-lg border border-border bg-surface-subtle px-4 py-8 text-text-muted"
      role="status"
    >
      <PendingIndicator />
      <span>Loading your flocks…</span>
    </div>
  )
}

function FlocksError({ isRetrying, onRetry }: FlocksErrorProps) {
  return (
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
  )
}

function EmptyFlocks({ onCreate }: EmptyFlocksProps) {
  return (
    <div className="min-h-32 rounded-lg border border-border bg-surface-subtle px-4 py-5">
      <h2 className="m-0 font-display text-lg font-bold text-text">
        No flocks yet
      </h2>
      <p className="mt-2 mb-5 leading-6 text-text-muted">
        Flocks you create or join will appear here.
      </p>
      <Button className="w-full" onClick={onCreate}>
        Create a flock
      </Button>
    </div>
  )
}

function PopulatedFlocks({
  flocks,
  isRefreshing,
  onCreate,
  onSelect,
}: PopulatedFlocksProps) {
  return (
    <>
      <Button className="mb-6 w-full" variant="secondary" onClick={onCreate}>
        Create a flock
      </Button>
      <FlockList flocks={flocks} onSelect={onSelect} />
      {isRefreshing ? (
        <p className="sr-only" role="status">
          Refreshing your flocks…
        </p>
      ) : null}
    </>
  )
}

function FlocksPageContent({
  state,
  onCreate,
  onRetry,
  onSelect,
}: FlocksPageContentProps) {
  if (state.status === 'loading') {
    return <LoadingFlocks />
  }

  if (state.status === 'error') {
    return <FlocksError isRetrying={state.isRetrying} onRetry={onRetry} />
  }

  if (state.flocks.length === 0) {
    return <EmptyFlocks onCreate={onCreate} />
  }

  return (
    <PopulatedFlocks
      flocks={state.flocks}
      isRefreshing={state.isRefreshing}
      onCreate={onCreate}
      onSelect={onSelect}
    />
  )
}

export default FlocksPageContent
