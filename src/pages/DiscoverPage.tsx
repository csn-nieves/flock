import { useState, type ReactNode } from 'react'
import Button from '@src/primitives/Button'
import TextField from '@src/primitives/TextField'
import { useFlockSearch, useRunnerSearch } from '@src/hooks/useDiscoverySearch'

type DiscoveryFilter = 'all' | 'runners' | 'flocks'

const filterLabels: Record<DiscoveryFilter, string> = {
  all: 'All',
  flocks: 'Flocks',
  runners: 'Runners',
}

export type DiscoverPageProps = {
  onSelectFlock: (flockId: string) => void
  onSelectRunner: (userId: string) => void
}

function DiscoverPage({ onSelectFlock, onSelectRunner }: DiscoverPageProps) {
  const [term, setTerm] = useState('')
  const [location, setLocation] = useState('')
  const [submitted, setSubmitted] = useState('')
  const [submittedLocation, setSubmittedLocation] = useState('')
  const [filter, setFilter] = useState<DiscoveryFilter>('all')
  const runners = useRunnerSearch(
    submitted,
    submittedLocation,
    filter === 'all' || filter === 'runners',
  )
  const flocks = useFlockSearch(
    submitted,
    submittedLocation,
    filter === 'all' || filter === 'flocks',
  )
  const canSearch = term.trim().length >= 2

  function renderRunners(): ReactNode {
    if (runners.isPending) return <p role="status">Searching runners…</p>
    if (runners.isError) return <p role="alert">We could not search runners.</p>
    if (runners.data?.length) {
      return (
        <ul className="mt-2 space-y-2">
          {runners.data.map((runner) => (
            <li key={runner.user_id}>
              <Button
                aria-label={`Open profile for ${runner.display_name}`}
                className="w-full justify-between rounded-md px-4 py-3 text-left"
                variant="secondary"
                onClick={() => onSelectRunner(runner.user_id)}
              >
                <span className="truncate">{runner.display_name}</span>
                <span
                  className="flex shrink-0 items-center gap-3"
                  aria-hidden="true"
                >
                  {runner.location ? (
                    <span className="max-w-32 truncate text-xs font-normal text-text-muted">
                      {runner.location}
                    </span>
                  ) : null}
                  <span>→</span>
                </span>
              </Button>
            </li>
          ))}
        </ul>
      )
    }
    return <p className="mt-2 text-text-muted">No runners found.</p>
  }

  function renderFlocks(): ReactNode {
    if (flocks.isPending) return <p role="status">Searching flocks…</p>
    if (flocks.isError) return <p role="alert">We could not search flocks.</p>
    if (flocks.data?.length) {
      return (
        <ul className="mt-2 space-y-2">
          {flocks.data.map((flock) => (
            <li key={flock.id}>
              <Button
                aria-label={`Open ${flock.name}`}
                className="w-full justify-between rounded-md px-4 py-3 text-left"
                variant="secondary"
                onClick={() => onSelectFlock(flock.id)}
              >
                <span className="min-w-0 text-left">
                  <span className="block truncate">{flock.name}</span>
                  {flock.description ? (
                    <span className="mt-1 block truncate text-xs font-normal text-text-muted">
                      {flock.description}
                    </span>
                  ) : null}
                </span>
                <span
                  className="flex shrink-0 items-center gap-3"
                  aria-hidden="true"
                >
                  {flock.location ? (
                    <span className="max-w-32 truncate text-xs font-normal text-text-muted">
                      {flock.location}
                    </span>
                  ) : null}
                  <span>→</span>
                </span>
              </Button>
            </li>
          ))}
        </ul>
      )
    }
    return <p className="mt-2 text-text-muted">No flocks found.</p>
  }

  return (
    <section
      aria-labelledby="discover-heading"
      className="mx-auto w-full max-w-xl py-8 sm:py-12"
    >
      <h1
        className="m-0 font-display text-3xl font-bold text-text"
        id="discover-heading"
      >
        Discover
      </h1>
      <p className="mt-2 text-text-muted">
        Find runners and flocks by name, then narrow the results by location.
      </p>
      <form
        noValidate
        className="mt-6 grid gap-4"
        onSubmit={(event) => {
          event.preventDefault()
          if (canSearch) {
            setSubmitted(term.trim())
            setSubmittedLocation(location.trim())
          }
        }}
      >
        <TextField
          aria-label="Search runners and flocks"
          label="Search"
          name="search"
          value={term}
          onChange={(event) => setTerm(event.target.value)}
        />
        <TextField
          aria-label="Filter by location"
          label="Location (optional)"
          name="location"
          value={location}
          onChange={(event) => setLocation(event.target.value)}
        />
        <div
          className="flex flex-wrap gap-2"
          aria-label="Result type"
          role="group"
        >
          {(['all', 'runners', 'flocks'] as const).map((option) => {
            const isSelected = filter === option
            return (
              <button
                aria-pressed={isSelected}
                className={[
                  'min-h-10 rounded-full border px-4 text-sm font-bold transition-colors duration-fast',
                  isSelected
                    ? 'border-primary bg-primary text-on-primary'
                    : 'border-border bg-background text-text-muted hover:bg-surface-subtle hover:text-text',
                ].join(' ')}
                key={option}
                type="button"
                onClick={() => setFilter(option)}
              >
                {filterLabels[option]}
              </button>
            )
          })}
        </div>
        <Button className="w-full sm:w-fit" disabled={!canSearch} type="submit">
          Search
        </Button>
      </form>
      {submitted ? (
        <div className="mt-8 space-y-6">
          {filter !== 'flocks' ? (
            <section aria-labelledby="runner-results-heading">
              <h2
                className="font-display text-lg font-bold text-text"
                id="runner-results-heading"
              >
                Runners
              </h2>
              {renderRunners()}
            </section>
          ) : null}
          {filter !== 'runners' ? (
            <section aria-labelledby="flock-results-heading">
              <h2
                className="font-display text-lg font-bold text-text"
                id="flock-results-heading"
              >
                Flocks
              </h2>
              {renderFlocks()}
            </section>
          ) : null}
        </div>
      ) : (
        <p className="mt-6 text-sm text-text-muted">
          Enter at least two characters to search.
        </p>
      )}
    </section>
  )
}

export default DiscoverPage
