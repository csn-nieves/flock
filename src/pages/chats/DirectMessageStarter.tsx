import { useRef } from 'react'

import type { RunnerSearchResult } from '@src/data/discovery'
import Button from '@src/primitives/Button'
import PendingIndicator from '@src/primitives/PendingIndicator'
import TextField from '@src/primitives/TextField'

export type DirectMessageStarterProps = {
  isComposing: boolean
  isSearching: boolean
  isStarting: boolean
  onCompositionChange: (isComposing: boolean) => void
  onSearchTermChange: (term: string) => void
  onSelectRunner: (runner: RunnerSearchResult) => Promise<void>
  results: readonly RunnerSearchResult[]
  searchTerm: string
  searchError?: string
  startError?: string
  startingUserId?: string
}

function DirectMessageStarter({
  isComposing,
  isSearching,
  isStarting,
  onCompositionChange,
  onSearchTermChange,
  onSelectRunner,
  results,
  searchError,
  searchTerm,
  startError,
  startingUserId,
}: DirectMessageStarterProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const normalizedSearchTerm = searchTerm.trim()
  const canShowResults = normalizedSearchTerm.length >= 2 && !isComposing

  return (
    <section
      aria-labelledby="new-direct-message-heading"
      className="mx-auto w-full max-w-xl px-4 py-8 sm:px-6 sm:py-12"
    >
      <p className="m-0 text-xs font-bold tracking-[0.1em] text-primary uppercase">
        Direct message
      </p>
      <h2
        className="mt-1 mb-0 font-display text-2xl font-bold text-text"
        id="new-direct-message-heading"
      >
        Start a conversation
      </h2>
      <p className="mt-2 mb-0 max-w-lg text-sm leading-5 text-text-muted">
        Find another runner by display name. Only the two of you can open and
        continue this conversation.
      </p>

      <div className="relative mt-6">
        <TextField
          aria-label="Search runners for a direct message"
          autoComplete="off"
          className="pr-12"
          hint="Enter at least two characters."
          label="Runner"
          name="direct-message-runner"
          ref={inputRef}
          type="search"
          value={searchTerm}
          onChange={(event) => onSearchTermChange(event.target.value)}
          onCompositionEnd={(event) => {
            onCompositionChange(false)
            onSearchTermChange(event.currentTarget.value)
          }}
          onCompositionStart={() => onCompositionChange(true)}
        />
        {searchTerm ? (
          <Button
            aria-label="Clear runner search"
            className="absolute top-7 right-1 min-w-touch px-2 text-text-muted"
            disabled={isStarting}
            variant="ghost"
            onClick={() => {
              onSearchTermChange('')
              onCompositionChange(false)
              inputRef.current?.focus()
            }}
          >
            ×
          </Button>
        ) : null}
      </div>

      {isSearching && canShowResults ? (
        <div
          className="flex min-h-12 items-center gap-2 text-sm text-text-muted"
          role="status"
        >
          <PendingIndicator className="size-4" />
          Searching runners…
        </div>
      ) : null}

      {searchError ? (
        <p className="mt-1 mb-0 text-sm text-text" role="alert">
          <span className="font-bold text-accent">Search failed:</span>{' '}
          {searchError}
        </p>
      ) : null}

      {startError ? (
        <p className="mt-1 mb-0 text-sm text-text" role="alert">
          <span className="font-bold text-accent">Could not start:</span>{' '}
          {startError}
        </p>
      ) : null}

      {canShowResults && !isSearching && !searchError ? (
        <div className="mt-2">
          <h3 className="m-0 font-display text-sm font-bold text-text">
            Search results
          </h3>
          {results.length === 0 ? (
            <p className="mt-3 mb-0 text-sm text-text-muted">
              No runners match that name.
            </p>
          ) : (
            <ul
              aria-label="Runner search results"
              className="mt-3 grid list-none gap-2 p-0"
            >
              {results.map((runner) => (
                <li key={runner.user_id}>
                  <Button
                    className="w-full justify-start gap-3 px-3 py-2 text-left"
                    disabled={isStarting}
                    isPending={isStarting && startingUserId === runner.user_id}
                    pendingLabel={`Opening conversation with ${runner.display_name}`}
                    variant="secondary"
                    onClick={() => void onSelectRunner(runner)}
                  >
                    <span
                      aria-hidden="true"
                      className="flex size-8 shrink-0 items-center justify-center rounded-full bg-surface-subtle font-display text-xs font-bold text-primary-strong"
                    >
                      {runner.display_name
                        .trim()
                        .charAt(0)
                        .toLocaleUpperCase() || '?'}
                    </span>
                    <span className="min-w-0 truncate">
                      {runner.display_name}
                    </span>
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </section>
  )
}

export default DirectMessageStarter
