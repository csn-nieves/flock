import { lazy, Suspense } from 'react'

import PendingIndicator from '@src/primitives/PendingIndicator'
import type { EventRoute } from '@src/types/events'

const RouteMapCanvas = lazy(() => import('./RouteMapCanvas'))

type RouteMapProps = {
  route: EventRoute
}

function RouteMap({ route }: RouteMapProps) {
  return (
    <Suspense
      fallback={
        <div className="flex h-64 items-center justify-center rounded-lg border border-border bg-surface-subtle text-sm text-text-muted">
          <PendingIndicator /> Loading map
        </div>
      }
    >
      <RouteMapCanvas route={route} />
    </Suspense>
  )
}

export default RouteMap
