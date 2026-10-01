import FlockList from '@src/components/FlockList'
import Button from '@src/primitives/Button'
import type { FlockSummary } from '@src/types/flocks'

type FlocksPageContentProps = {
  flocks: readonly FlockSummary[]
  isRefreshing: boolean
  onCreate: () => void
  onProfile: () => void
  onSelect: (flockId: string) => void
}

function EmptyFlocks({ onCreate }: { onCreate: () => void }) {
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

function FlocksPageContent({
  flocks,
  isRefreshing,
  onCreate,
  onProfile,
  onSelect,
}: FlocksPageContentProps) {
  if (flocks.length === 0) {
    return (
      <>
        <Button className="mb-4 w-full" variant="secondary" onClick={onProfile}>
          Your profile
        </Button>
        <EmptyFlocks onCreate={onCreate} />
      </>
    )
  }

  return (
    <>
      <div className="mb-6 grid gap-3 sm:grid-cols-2">
        <Button variant="secondary" onClick={onProfile}>
          Your profile
        </Button>
        <Button variant="secondary" onClick={onCreate}>
          Create a flock
        </Button>
      </div>
      <FlockList flocks={flocks} onSelect={onSelect} />
      {isRefreshing ? (
        <p className="sr-only" role="status">
          Refreshing your flocks…
        </p>
      ) : null}
    </>
  )
}

export default FlocksPageContent
