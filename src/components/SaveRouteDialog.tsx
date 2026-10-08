import { useRef, useState } from 'react'

import Button from '@src/primitives/Button'
import TextField from '@src/primitives/TextField'
import type { EventRoute, RunUnit } from '@src/types/events'
import type { SavedRouteLibrary } from '@src/types/savedRoutes'
import Modal from './Modal'
import RouteMap from './RouteMap'

type SaveRouteDialogProps = {
  library: SavedRouteLibrary
  onClose: () => void
  onSaved: () => void
  route: EventRoute
  unit: RunUnit
}

function formatDistance(distanceMeters: number, unit: RunUnit) {
  const divisor = unit === 'mi' ? 1609.344 : 1000
  return `${(distanceMeters / divisor).toFixed(2)} ${unit}`
}

function SaveRouteDialog({
  library,
  onClose,
  onSaved,
  route,
  unit,
}: SaveRouteDialogProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [name, setName] = useState('')
  const [error, setError] = useState<string>()
  const [showValidation, setShowValidation] = useState(false)

  async function submit() {
    setShowValidation(true)
    const normalizedName = name.trim()
    if (!normalizedName) {
      inputRef.current?.focus()
      return
    }
    setError(undefined)
    try {
      await library.onSave(normalizedName, route)
      onSaved()
    } catch {
      setError('We could not save this route. Use a unique name and try again.')
    }
  }

  return (
    <Modal
      description={`Keep this ${formatDistance(route.distanceMeters, unit)} route in your private library.`}
      onClose={onClose}
      title="Save route for later"
    >
      <div className="space-y-3">
        {error ? (
          <p
            className="m-0 rounded-md border border-accent bg-surface-subtle px-4 py-3 text-sm text-text"
            role="alert"
          >
            {error}
          </p>
        ) : null}
        <TextField
          autoFocus
          error={
            showValidation && !name.trim()
              ? 'Enter a name for this route.'
              : undefined
          }
          label="Route name"
          maxLength={80}
          ref={inputRef}
          value={name}
          onChange={(event) => setName(event.target.value)}
          onKeyDown={(event) => {
            if (event.key !== 'Enter') return
            event.preventDefault()
            void submit()
          }}
        />
        <RouteMap route={route} />
        <div className="grid gap-2 sm:flex sm:flex-row-reverse">
          <Button
            className="w-full sm:w-auto"
            isPending={library.isSaving}
            pendingLabel="Saving route"
            type="button"
            onClick={() => void submit()}
          >
            Save route
          </Button>
          <Button
            className="w-full sm:w-auto"
            type="button"
            variant="secondary"
            onClick={onClose}
          >
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default SaveRouteDialog
