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
            {flock.imageUrl ? (
              <img
                alt=""
                className="size-12 shrink-0 rounded-lg object-cover"
                src={flock.imageUrl}
              />
            ) : (
              <span
                aria-hidden="true"
                className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-primary text-lg font-bold text-on-primary"
              >
                {flock.name.charAt(0).toLocaleUpperCase()}
              </span>
            )}
            <span className="min-w-0 flex-1 text-left">
              <span className="block font-display text-base leading-6 font-bold tracking-[-0.01em] text-text [overflow-wrap:anywhere]">
                {flock.name}
              </span>
              <span className="mt-0.5 block text-sm leading-5 text-text-muted [overflow-wrap:anywhere]">
                {flock.location ?? 'Location not added yet'}
              </span>
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
