import type { FlockSummary } from '@src/types/flocks'
import Button from '@src/primitives/Button'

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
          <Button
            aria-label={`Open ${flock.name}`}
            className="w-full justify-between gap-4 rounded-lg px-4 py-3 text-left hover:border-primary active:border-primary-strong"
            onClick={() => onSelect(flock.id)}
            variant="secondary"
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
          </Button>
        </li>
      ))}
    </ul>
  )
}

export default FlockList
