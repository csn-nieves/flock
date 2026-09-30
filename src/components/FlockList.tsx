import type { FlockSummary } from '@src/data/flocks'

export type FlockListProps = {
  flocks: readonly FlockSummary[]
  onSelect: (flockId: string) => void
}

function FlockList({ flocks, onSelect }: FlockListProps) {
  if (flocks.length === 0) {
    return null
  }

  return (
    <ul aria-label="Your flocks" className="m-0 grid list-none gap-3 p-0">
      {flocks.map((flock) => (
        <li key={flock.id}>
          <button
            aria-label={`Open ${flock.name}`}
            className="flex min-h-16 w-full cursor-pointer items-center justify-between gap-4 rounded-lg border border-border bg-background px-4 py-3 text-left transition-[background-color,border-color] duration-fast ease-out hover:border-primary hover:bg-surface-subtle active:border-primary-strong active:bg-surface-subtle"
            type="button"
            onClick={() => onSelect(flock.id)}
          >
            <span className="min-w-0 font-display text-base font-bold leading-6 tracking-[-0.01em] text-text [overflow-wrap:anywhere]">
              {flock.name}
            </span>
            <span
              aria-hidden="true"
              className="flex shrink-0 items-center gap-1 text-sm font-bold text-primary-strong"
            >
              Open <span>→</span>
            </span>
          </button>
        </li>
      ))}
    </ul>
  )
}

export default FlockList
