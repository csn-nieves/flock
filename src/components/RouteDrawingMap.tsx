import { lazy, Suspense } from 'react'

import PendingIndicator from '@src/primitives/PendingIndicator'
import type { EventRoute, RouteCoordinate } from '@src/types/events'

const RouteDrawingMapCanvas = lazy(() => import('./RouteDrawingMapCanvas'))

type RouteDrawingMapProps = {
  isPlanning: boolean
  onAddPoint: (coordinate: RouteCoordinate) => void
  route: EventRoute | undefined
  waypoints: readonly RouteCoordinate[]
  initialCenter?: RouteCoordinate
}

function RouteDrawingMap(props: RouteDrawingMapProps) {
  return (
    <Suspense
      fallback={
        <div className="flex h-72 items-center justify-center rounded-lg border border-border bg-surface-subtle text-sm text-text-muted">
          <PendingIndicator /> Loading route planner
        </div>
      }
    >
      <RouteDrawingMapCanvas {...props} />
    </Suspense>
  )
}

export default RouteDrawingMap
