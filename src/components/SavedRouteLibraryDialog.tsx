import { useMemo, useState } from 'react'

import Button from '@src/primitives/Button'
import PendingIndicator from '@src/primitives/PendingIndicator'
import TextField from '@src/primitives/TextField'
import type { EventRoute, RunUnit } from '@src/types/events'
import type { SavedRouteLibrary } from '@src/types/savedRoutes'
import Modal from './Modal'
import RouteMap from './RouteMap'

type SavedRouteLibraryDialogProps = {
  library: SavedRouteLibrary
  onClose: () => void
  onUseRoute: (route: EventRoute) => void
  unit: RunUnit
}

function formatDistance(distanceMeters: number, unit: RunUnit) {
  const divisor = unit === 'mi' ? 1609.344 : 1000
  return `${(distanceMeters / divisor).toFixed(2)} ${unit}`
}

function SavedRouteLibraryDialog({
  library,
  onClose,
  onUseRoute,
  unit,
}: SavedRouteLibraryDialogProps) {
  const [selectedId, setSelectedId] = useState<string>()
  const [renamingId, setRenamingId] = useState<string>()
  const [renameValue, setRenameValue] = useState('')
  const [deletingId, setDeletingId] = useState<string>()
  const [error, setError] = useState<string>()
  const selectedRoute = useMemo(
    () =>
      library.routes.find((route) => route.id === selectedId) ??
      library.routes[0],
    [library.routes, selectedId],
  )

  async function renameRoute() {
    const normalizedName = renameValue.trim()
    if (!renamingId || !normalizedName) return
    setError(undefined)
    try {
      await library.onRename(renamingId, normalizedName)
      setRenamingId(undefined)
    } catch {
      setError(
        'We could not rename this route. Use a unique name and try again.',
      )
    }
  }

  async function deleteRoute() {
    if (!deletingId) return
    setError(undefined)
    try {
      await library.onDelete(deletingId)
      setDeletingId(undefined)
      setSelectedId(undefined)
    } catch {
      setError('We could not delete this route. Try again.')
    }
  }

  return (
    <Modal
      description="Preview a private saved route and copy it into this event."
      onClose={onClose}
      size="wide"
      title="Choose a saved route"
    >
      {library.status === 'loading' ? (
        <div
          className="flex min-h-48 items-center justify-center gap-2 text-sm text-text-muted"
          role="status"
        >
          <PendingIndicator /> Loading saved routes
        </div>
      ) : null}
      {library.status === 'error' ? (
        <div
          className="rounded-lg border border-accent bg-surface-subtle p-4"
          role="alert"
        >
          <p className="m-0 text-sm text-text">
            We could not load your saved routes.
          </p>
          <Button
            className="mt-3"
            variant="secondary"
            onClick={library.onRetry}
          >
            Try again
          </Button>
        </div>
      ) : null}
      {library.status === 'ready' && library.routes.length === 0 ? (
        <div className="rounded-lg border border-border bg-surface-subtle p-5 text-center">
          <p className="m-0 font-bold text-text">No saved routes yet</p>
          <p className="mt-1 mb-0 text-sm leading-5 text-text-muted">
            Draw or import a route, then choose Save for later.
          </p>
        </div>
      ) : null}
      {library.status === 'ready' && selectedRoute ? (
        <div className="grid gap-4 sm:grid-cols-[14rem_minmax(0,1fr)]">
          <ul className="m-0 max-h-80 list-none space-y-2 overflow-y-auto p-0 sm:max-h-[26rem]">
            {library.routes.map((route) => {
              const isSelected = route.id === selectedRoute.id
              return (
                <li key={route.id}>
                  <button
                    aria-pressed={isSelected}
                    className="min-h-touch w-full cursor-pointer rounded-md border border-border bg-background px-3 py-2 text-left hover:bg-surface-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus aria-pressed:border-primary aria-pressed:bg-surface-subtle"
                    type="button"
                    onClick={() => {
                      setSelectedId(route.id)
                      setDeletingId(undefined)
                      setRenamingId(undefined)
                    }}
                  >
                    <span className="block font-bold text-text">
                      {route.name}
                    </span>
                    <span className="mt-1 block text-xs text-text-muted">
                      {formatDistance(route.route.distanceMeters, unit)}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
          <div className="min-w-0">
            {error ? (
              <p
                className="mt-0 mb-3 rounded-md border border-accent bg-surface-subtle px-3 py-2 text-sm text-text"
                role="alert"
              >
                {error}
              </p>
            ) : null}
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <p className="m-0 font-display text-lg font-bold text-text">
                  {selectedRoute.name}
                </p>
                <p className="mt-1 mb-0 text-sm text-text-muted">
                  {formatDistance(selectedRoute.route.distanceMeters, unit)}
                </p>
              </div>
            </div>
            <RouteMap route={selectedRoute.route} />
            {renamingId === selectedRoute.id ? (
              <div className="mt-3 rounded-lg border border-border bg-surface-subtle p-3">
                <TextField
                  autoFocus
                  label="Route name"
                  maxLength={80}
                  value={renameValue}
                  onChange={(event) => setRenameValue(event.target.value)}
                />
                <div className="flex flex-wrap gap-2">
                  <Button
                    disabled={!renameValue.trim()}
                    isPending={library.isRenaming}
                    pendingLabel="Saving name"
                    onClick={() => void renameRoute()}
                  >
                    Save name
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => setRenamingId(undefined)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : null}
            {deletingId === selectedRoute.id ? (
              <div
                className="mt-3 rounded-lg border border-danger bg-surface-subtle p-3"
                role="alertdialog"
                aria-label={`Delete ${selectedRoute.name}`}
              >
                <p className="m-0 text-sm text-text">
                  Delete this saved route? Events already using it will not
                  change.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    isPending={library.isDeleting}
                    pendingLabel="Deleting route"
                    variant="danger"
                    onClick={() => void deleteRoute()}
                  >
                    Delete route
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => setDeletingId(undefined)}
                  >
                    Keep route
                  </Button>
                </div>
              </div>
            ) : null}
            {!renamingId && !deletingId ? (
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setRenameValue(selectedRoute.name)
                    setRenamingId(selectedRoute.id)
                  }}
                >
                  Rename
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setDeletingId(selectedRoute.id)}
                >
                  Delete
                </Button>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
      <div className="mt-5 grid gap-2 sm:flex sm:flex-row-reverse">
        <Button
          className="w-full sm:w-auto"
          disabled={
            !selectedRoute || Boolean(renamingId) || Boolean(deletingId)
          }
          onClick={() => selectedRoute && onUseRoute(selectedRoute.route)}
        >
          Use this route
        </Button>
        <Button
          className="w-full sm:w-auto"
          variant="secondary"
          onClick={onClose}
        >
          Cancel
        </Button>
      </div>
    </Modal>
  )
}

export default SavedRouteLibraryDialog
