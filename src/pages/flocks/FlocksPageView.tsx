import FlocksPageContent, { type FlocksPageState } from './FlocksPageContent'

export type FlocksPageViewProps = {
  state: FlocksPageState
  onCreate: () => void
  onRetry: () => void
  onSelect: (flockId: string) => void
}

function FlocksPageView({
  state,
  onCreate,
  onRetry,
  onSelect,
}: FlocksPageViewProps) {
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

      <div className="mt-8">
        <FlocksPageContent
          state={state}
          onCreate={onCreate}
          onRetry={onRetry}
          onSelect={onSelect}
        />
      </div>
    </section>
  )
}

export default FlocksPageView
