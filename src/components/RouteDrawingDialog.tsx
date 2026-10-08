import { useEffect, useMemo, useRef, useState } from 'react'

import { RoutePlanningError } from '@src/data/routePlanning'
import { useRoutePlanner } from '@src/hooks/useRoutePlanner'
import { boundRouteCoordinates } from '@src/lib/gpx'
import Button from '@src/primitives/Button'
import type { EventRoute, RouteCoordinate, RunUnit } from '@src/types/events'
import Modal from './Modal'
import RouteDrawingMap from './RouteDrawingMap'

const MAX_WAYPOINTS = 25

type RouteDrawingDialogProps = {
  location: string
  onClose: () => void
  onUseRoute: (route: EventRoute) => void
  unit: RunUnit
}

function formattedDistance(distanceMeters: number, unit: RunUnit) {
  const divisor = unit === 'mi' ? 1609.344 : 1000
  return `${(distanceMeters / divisor).toFixed(2)} ${unit}`
}

function RouteDrawingDialog({
  location,
  onClose,
  onUseRoute,
  unit,
}: RouteDrawingDialogProps) {
  const { isConfigured, locate, planSegment } = useRoutePlanner()
  const [waypoints, setWaypoints] = useState<RouteCoordinate[]>([])
  const [segments, setSegments] = useState<EventRoute[]>([])
  const [initialCenter, setInitialCenter] = useState<RouteCoordinate>()
  const [error, setError] = useState<string>()
  const [isPlanning, setIsPlanning] = useState(false)
  const isPlanningRef = useRef(false)

  useEffect(() => {
    if (!isConfigured) return
    let isCurrent = true
    locate(location)
      .then((coordinate) => {
        if (isCurrent && coordinate) setInitialCenter(coordinate)
      })
      .catch((caughtError: unknown) => {
        if (
          !(caughtError instanceof DOMException) ||
          caughtError.name !== 'AbortError'
        ) {
          setInitialCenter(undefined)
        }
      })
    return () => {
      isCurrent = false
    }
  }, [isConfigured, locate, location])

  const route = useMemo<EventRoute | undefined>(() => {
    if (!segments.length) return undefined
    const coordinates = segments.flatMap((segment, index) =>
      index === 0 ? segment.coordinates : segment.coordinates.slice(1),
    )
    return {
      coordinates: boundRouteCoordinates(coordinates),
      distanceMeters: segments.reduce(
        (distance, segment) => distance + segment.distanceMeters,
        0,
      ),
    }
  }, [segments])

  async function addPoint(coordinate: RouteCoordinate) {
    if (isPlanningRef.current || waypoints.length >= MAX_WAYPOINTS) return
    setError(undefined)
    const previous = waypoints.at(-1)
    if (!previous) {
      setWaypoints([coordinate])
      return
    }
    isPlanningRef.current = true
    setIsPlanning(true)
    try {
      const segment = await planSegment(previous, coordinate)
      setSegments((current) => [...current, segment])
      setWaypoints((current) => [...current, coordinate])
    } catch (caughtError) {
      if (
        caughtError instanceof DOMException &&
        caughtError.name === 'AbortError'
      ) {
        return
      }
      setError(
        caughtError instanceof RoutePlanningError
          ? caughtError.message
          : 'We could not plan that part of the route. Try again.',
      )
    } finally {
      isPlanningRef.current = false
      setIsPlanning(false)
    }
  }

  function undoPoint() {
    setError(undefined)
    setWaypoints((current) => current.slice(0, -1))
    setSegments((current) => current.slice(0, -1))
  }

  function clearRoute() {
    setError(undefined)
    setWaypoints([])
    setSegments([])
  }

  return (
    <Modal
      description="Tap roads in order and Flock will connect each point with a walkable route."
      size="wide"
      title="Draw a route"
      onClose={onClose}
    >
      {!isConfigured ? (
        <div className="rounded-lg border border-border bg-surface-subtle p-4">
          <p className="m-0 font-bold text-text">
            Route drawing is not available here yet.
          </p>
          <p className="mt-1 mb-0 text-sm leading-5 text-text-muted">
            This environment needs its public route-planning key. You can still
            attach a GPX file instead.
          </p>
        </div>
      ) : (
        <>
          <RouteDrawingMap
            initialCenter={initialCenter}
            isPlanning={isPlanning}
            route={route}
            waypoints={waypoints}
            onAddPoint={addPoint}
          />
          <div className="mt-3 flex items-center justify-between gap-3 text-sm">
            <span className="text-text-muted">
              {waypoints.length} of {MAX_WAYPOINTS} points
            </span>
            <strong className="text-text">
              {route
                ? formattedDistance(route.distanceMeters, unit)
                : 'Add at least 2 points'}
            </strong>
          </div>
          {isPlanning ? (
            <p className="mt-2 mb-0 text-sm text-text-muted" role="status">
              Finding the walkable path…
            </p>
          ) : null}
          {error ? (
            <p className="mt-2 mb-0 text-sm text-danger" role="alert">
              {error}
            </p>
          ) : null}
          {waypoints.length >= MAX_WAYPOINTS ? (
            <p className="mt-2 mb-0 text-sm text-text-muted" role="status">
              This route has the maximum of {MAX_WAYPOINTS} points.
            </p>
          ) : null}
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              disabled={isPlanning || waypoints.length === 0}
              type="button"
              variant="secondary"
              onClick={undoPoint}
            >
              Undo last point
            </Button>
            <Button
              disabled={isPlanning || waypoints.length === 0}
              type="button"
              variant="ghost"
              onClick={clearRoute}
            >
              Clear route
            </Button>
          </div>
          <p className="mt-3 mb-0 text-xs leading-5 text-text-muted">
            Route planning by{' '}
            <a
              className="font-bold text-primary underline underline-offset-2"
              href="https://www.geoapify.com/"
              rel="noreferrer"
              target="_blank"
            >
              Geoapify
            </a>
            . Saved routes keep only the line and estimated distance.
          </p>
        </>
      )}
      <div className="mt-5 grid gap-2 sm:flex sm:flex-row-reverse">
        <Button
          className="w-full sm:w-auto"
          disabled={!route || isPlanning}
          type="button"
          onClick={() => route && onUseRoute(route)}
        >
          Use this route
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
    </Modal>
  )
}

export default RouteDrawingDialog
