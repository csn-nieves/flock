import { useState, type ReactNode } from 'react'
import Button from '@src/primitives/Button'
import TextField from '@src/primitives/TextField'
import { useFlockSearch, useRunnerSearch } from '@src/hooks/useDiscoverySearch'

function DiscoverPage() {
  const [term, setTerm] = useState('')
  const [submitted, setSubmitted] = useState('')
  const runners = useRunnerSearch(submitted)
  const flocks = useFlockSearch(submitted)
  const canSearch = term.trim().length >= 2

  function renderRunners(): ReactNode {
    if (runners.isPending) return <p role="status">Searching runners…</p>
    if (runners.isError) return <p role="alert">We could not search runners.</p>
    if (runners.data?.length) {
      return (
        <ul className="mt-2 space-y-2">
          {runners.data.map((runner) => (
            <li
              className="rounded-md border border-border px-4 py-3"
              key={runner.user_id}
            >
              {runner.display_name}
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
            <li
              className="rounded-md border border-border px-4 py-3"
              key={flock.id}
            >
              {flock.name}
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
      <p className="mt-2 text-text-muted">Find runners and flocks by name.</p>
      <form
        noValidate
        className="mt-6 flex gap-2"
        onSubmit={(event) => {
          event.preventDefault()
          if (canSearch) setSubmitted(term.trim())
        }}
      >
        <TextField
          aria-label="Search runners and flocks"
          label="Search"
          name="search"
          value={term}
          onChange={(event) => setTerm(event.target.value)}
        />
        <Button className="mt-7 shrink-0" disabled={!canSearch} type="submit">
          Search
        </Button>
      </form>
      {submitted ? (
        <div className="mt-8 space-y-6">
          <section aria-labelledby="runner-results-heading">
            <h2
              className="font-display text-lg font-bold text-text"
              id="runner-results-heading"
            >
              Runners
            </h2>
            {renderRunners()}
          </section>
          <section aria-labelledby="flock-results-heading">
            <h2
              className="font-display text-lg font-bold text-text"
              id="flock-results-heading"
            >
              Flocks
            </h2>
            {renderFlocks()}
          </section>
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
