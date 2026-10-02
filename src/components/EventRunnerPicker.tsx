import { useState } from 'react'
import { useRunnerSearch } from '@src/hooks/useDiscoverySearch'
import Button from '@src/primitives/Button'
import TextField from '@src/primitives/TextField'

export type EventRunnerPickerProps = {
  isPending: boolean
  onCancel: () => void
  onSelect: (userId: string, displayName: string) => void
}

export default function EventRunnerPicker({
  isPending,
  onCancel,
  onSelect,
}: EventRunnerPickerProps) {
  const [term, setTerm] = useState('')
  const results = useRunnerSearch(term)
  return (
    <div>
      <p className="mt-0 text-text-muted">
        Search for a runner to receive a private invitation link.
      </p>
      <TextField
        aria-label="Search runners"
        label="Runner"
        value={term}
        onChange={(event) => setTerm(event.target.value)}
      />
      {results.isPending ? <p role="status">Searching runners…</p> : null}
      {results.isError ? (
        <p role="alert">We could not search runners.</p>
      ) : null}
      {results.data?.length ? (
        <ul className="mt-3 grid gap-2">
          {results.data.map((runner) => (
            <li key={runner.user_id}>
              <Button
                className="w-full justify-start"
                disabled={isPending}
                variant="secondary"
                onClick={() => onSelect(runner.user_id, runner.display_name)}
              >
                {runner.display_name}
              </Button>
            </li>
          ))}
        </ul>
      ) : null}
      <Button className="mt-4 w-full" variant="ghost" onClick={onCancel}>
        Cancel
      </Button>
    </div>
  )
}
