import { useEffect } from 'react'
import { useNavigate } from 'react-router'

import FlockList from '@src/components/FlockList'
import type { FlockSummary } from '@src/data/flocks'
import { useFlocks } from '@src/hooks/useFlocks'
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

export type FlocksPageViewProps = {
  state: FlocksPageState
  onCreate: () => void
  onRetry: () => void
  onSelect: (flockId: string) => void
}

function FlocksPageHeader() {
  return (
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
  )
}

export function FlocksPageView({
  state,
  onCreate,
  onRetry,
  onSelect,
}: FlocksPageViewProps) {
  let content

  if (state.status === 'loading') {
    content = (
      <div
        className="flex min-h-32 items-center justify-center gap-3 rounded-lg border border-border bg-surface-subtle px-4 py-8 text-text-muted"
        role="status"
      >
        <PendingIndicator />
        <span>Loading your flocks…</span>
      </div>
    )
  } else if (state.status === 'error') {
    content = (
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
          isPending={state.isRetrying}
          pendingLabel="Trying again"
          variant="secondary"
          onClick={onRetry}
        >
          Try again
        </Button>
      </div>
    )
  } else if (state.flocks.length === 0) {
    content = (
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
  } else {
    content = (
      <>
        <Button className="mb-6 w-full" variant="secondary" onClick={onCreate}>
          Create a flock
        </Button>
        <FlockList flocks={state.flocks} onSelect={onSelect} />
        {state.isRefreshing ? (
          <p className="sr-only" role="status">
            Refreshing your flocks…
          </p>
        ) : null}
      </>
    )
  }

  return (
    <section
      aria-labelledby="flocks-heading"
      className="mx-auto w-full py-8 sm:py-12"
    >
      <FlocksPageHeader />
      <div className="mt-8">{content}</div>
    </section>
  )
}

function FlocksPage() {
  const flocksQuery = useFlocks()
  const navigate = useNavigate()
  let state: FlocksPageState
  let title = 'Your flocks — Flock'

  if (flocksQuery.isPending) {
    state = { status: 'loading' }
    title = 'Loading flocks… — Flock'
  } else if (flocksQuery.isError) {
    state = {
      isRetrying: flocksQuery.isFetching,
      status: 'error',
    }
    title = 'Flocks unavailable — Flock'
  } else {
    state = {
      flocks: flocksQuery.data,
      isRefreshing: flocksQuery.isFetching,
      status: 'success',
    }
  }

  useEffect(() => {
    document.title = title

    return () => {
      document.title = 'Flock'
    }
  }, [title])

  return (
    <FlocksPageView
      state={state}
      onCreate={() => navigate('/flocks/new')}
      onRetry={() => void flocksQuery.refetch()}
      onSelect={(flockId) => navigate(`/flocks/${encodeURIComponent(flockId)}`)}
    />
  )
}

export default FlocksPage
