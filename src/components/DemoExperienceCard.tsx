import Button from '@src/primitives/Button'

export type DemoExperienceCardProps = {
  error?: string
  isPending: boolean
  onStart: () => void
}

function DemoExperienceCard({
  error,
  isPending,
  onStart,
}: DemoExperienceCardProps) {
  return (
    <aside
      aria-labelledby="demo-experience-heading"
      className="relative isolate overflow-hidden rounded-lg border border-primary/30 bg-surface-subtle p-4 shadow-floating sm:p-5"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-20 -right-16 -z-10 size-48 rounded-full bg-primary/15 blur-2xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-24 -left-20 -z-10 size-48 rounded-full bg-accent/10 blur-2xl"
      />

      <div className="relative">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <img
              alt=""
              className="size-8 rounded-md"
              src="/icons/flock-mark.svg"
            />
            <span className="truncate text-xs font-bold uppercase tracking-[0.12em] text-text-muted">
              Flock demo
            </span>
          </div>
          <span className="shrink-0 rounded-pill bg-primary/12 px-2 py-1 text-[0.6875rem] font-bold uppercase tracking-[0.08em] text-primary-strong">
            Live demo
          </span>
        </div>

        <h2
          className="m-0 max-w-sm font-display text-2xl font-bold leading-tight tracking-[-0.025em] text-text"
          id="demo-experience-heading"
        >
          See how your next run comes together.
        </h2>
        <p className="mt-2 mb-0 max-w-sm text-sm leading-5 text-text-muted">
          Step into a ready-made flock with events, routes, conversations, and
          real seeded activity.
        </p>

        <div className="mt-5 overflow-hidden rounded-md border border-border bg-background">
          <div className="relative overflow-hidden bg-primary px-4 py-5 text-on-primary">
            <div
              aria-hidden="true"
              className="absolute -right-10 -bottom-16 size-36 rounded-full border-[18px] border-on-primary/15"
            />
            <div
              aria-hidden="true"
              className="absolute -right-2 -bottom-8 size-24 rounded-full border-[12px] border-on-primary/15"
            />
            <img
              alt=""
              className="relative size-10 rounded-lg bg-on-primary/15 p-1"
              src="/icons/flock-mark.svg"
            />
            <p className="relative mt-4 mb-0 text-xs font-bold uppercase tracking-[0.12em] text-on-primary/75">
              Demo workspace
            </p>
            <p className="relative mt-1 mb-0 max-w-xs font-display text-xl font-bold leading-tight">
              See Flock in motion with a ready-made runner community.
            </p>
          </div>

          <ul className="m-0 grid list-none gap-3 p-4">
            {[
              ['Flocks', 'Browse seeded running communities.'],
              ['Events', 'Open routes, plans, RSVPs, and invitations.'],
              ['Chats', 'Read conversations already in progress.'],
            ].map(([label, description]) => (
              <li className="flex items-start gap-3" key={label}>
                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary-strong">
                  ✓
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-bold text-text">
                    {label}
                  </span>
                  <span className="mt-0.5 block text-xs leading-4 text-text-muted">
                    {description}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <Button
          className="mt-5 w-full"
          disabled={isPending}
          isPending={isPending}
          pendingLabel="Opening demo…"
          type="button"
          onClick={onStart}
        >
          Explore the demo
        </Button>
        <p className="mt-2 mb-0 text-center text-xs leading-4 text-text-muted">
          No account or setup required.
        </p>
        {error ? (
          <p className="mt-3 mb-0 text-sm leading-5 text-danger" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </aside>
  )
}

export default DemoExperienceCard
