import { useRef } from 'react'
import type { FlockSearchResult, RunnerSearchResult } from '@src/data/discovery'
import Button from '@src/primitives/Button'
import TextField from '@src/primitives/TextField'

export type EventAudienceType = 'runner' | 'flock'

export type EventAudiencePickerProps = {
  audienceType: EventAudienceType
  isInviting: boolean
  isSearching: boolean
  searchTerm: string
  flocks: readonly FlockSearchResult[]
  runners: readonly RunnerSearchResult[]
  onAudienceTypeChange: (audienceType: EventAudienceType) => void
  onCancel: () => void
  onSearchTermChange: (searchTerm: string) => void
  onSelectFlock: (flockId: string, flockName: string) => void
  onSelectRunner: (userId: string, displayName: string) => void
  searchError?: string
}

export default function EventAudiencePicker({
  audienceType,
  flocks,
  isInviting,
  isSearching,
  onAudienceTypeChange,
  onCancel,
  onSearchTermChange,
  onSelectFlock,
  onSelectRunner,
  runners,
  searchError,
  searchTerm,
}: EventAudiencePickerProps) {
  const searchInputRef = useRef<HTMLInputElement>(null)
  const results = audienceType === 'runner' ? runners : flocks
  const label = audienceType === 'runner' ? 'Runner' : 'Flock'
  const canShowResults =
    !isSearching && !searchError && searchTerm.trim().length >= 2
  let searchResults = null

  if (canShowResults && results.length === 0) {
    searchResults = (
      <p className="mt-1 text-sm text-text-muted">
        No {label.toLowerCase()}s match that search.
      </p>
    )
  } else if (canShowResults) {
    searchResults = (
      <ul className="mt-1 grid gap-2">
        {audienceType === 'runner'
          ? runners.map((runner) => (
              <li key={runner.user_id}>
                <Button
                  className="w-full justify-start"
                  disabled={isInviting}
                  variant="secondary"
                  onClick={() =>
                    onSelectRunner(runner.user_id, runner.display_name)
                  }
                >
                  {runner.display_name}
                </Button>
              </li>
            ))
          : flocks.map((flock) => (
              <li key={flock.id}>
                <Button
                  className="w-full justify-start"
                  disabled={isInviting}
                  variant="secondary"
                  onClick={() => onSelectFlock(flock.id, flock.name)}
                >
                  {flock.name}
                </Button>
              </li>
            ))}
      </ul>
    )
  }

  return (
    <div>
      <div
        aria-label="Invitation audience"
        className="grid grid-cols-2 gap-2"
        role="group"
      >
        <Button
          aria-pressed={audienceType === 'runner'}
          disabled={isInviting}
          variant={audienceType === 'runner' ? 'primary' : 'secondary'}
          onClick={() => onAudienceTypeChange('runner')}
        >
          One runner
        </Button>
        <Button
          aria-pressed={audienceType === 'flock'}
          disabled={isInviting}
          variant={audienceType === 'flock' ? 'primary' : 'secondary'}
          onClick={() => onAudienceTypeChange('flock')}
        >
          A whole flock
        </Button>
      </div>

      <p className="mt-4 mb-3 text-sm leading-5 text-text-muted">
        {audienceType === 'runner'
          ? 'Choose one runner. They will see the invitation in Flock, and their optional link will only work for them.'
          : 'Invite the flock as one live audience. Current members will see it in Flock, including anyone who joins before it expires.'}
      </p>

      <div className="relative">
        <TextField
          aria-label={`Search ${label.toLowerCase()}s`}
          className="pr-12"
          disabled={isInviting}
          label={label}
          ref={searchInputRef}
          value={searchTerm}
          onChange={(event) => onSearchTermChange(event.target.value)}
        />
        {searchTerm ? (
          <Button
            aria-label={`Clear ${label.toLowerCase()} search`}
            className="absolute top-7 right-1 min-w-touch px-2 text-text-muted"
            disabled={isInviting}
            variant="ghost"
            onClick={() => {
              onSearchTermChange('')
              searchInputRef.current?.focus()
            }}
          >
            ×
          </Button>
        ) : null}
      </div>

      {isSearching ? (
        <p className="mt-0 text-sm text-text-muted" role="status">
          Searching {label.toLowerCase()}s…
        </p>
      ) : null}
      {isInviting ? (
        <p className="mt-0 text-sm text-text-muted" role="status">
          Creating invitation…
        </p>
      ) : null}
      {searchError ? (
        <p className="mt-0 text-sm text-text" role="alert">
          {searchError}
        </p>
      ) : null}
      {searchResults}

      <Button
        className="mt-4 w-full"
        disabled={isInviting}
        variant="ghost"
        onClick={onCancel}
      >
        Cancel
      </Button>
    </div>
  )
}
