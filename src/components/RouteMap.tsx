import { lazy, Suspense } from 'react'

import PendingIndicator from '@src/primitives/PendingIndicator'
import type { EventRoute } from '@src/types/events'

const RouteMapCanvas = lazy(() => import('./RouteMapCanvas'))

type RouteMapProps = {
  route: EventRoute
  size?: 'default' | 'large'
}

function RouteMap({ route, size = 'default' }: RouteMapProps) {
  const heightClass = size === 'large' ? 'sm:h-[26rem]' : null

  return (
    <Suspense
      fallback={
        <div
          className={`flex h-64 items-center justify-center rounded-lg border border-border bg-surface-subtle text-sm text-text-muted ${heightClass ?? ''}`}
        >
          <PendingIndicator /> Loading map
        </div>
      }
    >
      <RouteMapCanvas route={route} size={size} />
    </Suspense>
  )
}

export default RouteMap
