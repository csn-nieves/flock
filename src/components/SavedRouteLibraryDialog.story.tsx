import { useState } from 'react'

import type { SavedRoute } from '@src/types/savedRoutes'
import SavedRouteLibraryDialog from './SavedRouteLibraryDialog'

const initialRoutes: SavedRoute[] = [
  {
    createdAt: '2026-10-01T12:00:00Z',
    id: 'river-route',
    name: 'Riverside five-mile loop',
    route: {
      coordinates: [
        [-74.01, 40.7],
        [-74.005, 40.704],
        [-73.999, 40.708],
      ],
      distanceMeters: 8050,
    },
    updatedAt: '2026-10-01T12:00:00Z',
  },
  {
    createdAt: '2026-10-02T12:00:00Z',
    id: 'harbor-route',
    name: 'Harbor recovery loop',
    route: {
      coordinates: [
        [-71.065, 42.355],
        [-71.058, 42.358],
        [-71.052, 42.353],
      ],
      distanceMeters: 5000,
    },
    updatedAt: '2026-10-02T12:00:00Z',
  },
]

export function Ready() {
  const [routes, setRoutes] = useState(initialRoutes)
  const [usedRoute, setUsedRoute] = useState<string>()

  return (
    <>
      <SavedRouteLibraryDialog
        library={{
          isDeleting: false,
          isLoading: false,
          isRenaming: false,
          isSaving: false,
          routes,
          status: 'ready',
          onDelete: async (routeId) =>
            setRoutes((current) =>
              current.filter((route) => route.id !== routeId),
            ),
          onRename: async (routeId, name) =>
            setRoutes((current) =>
              current.map((route) =>
                route.id === routeId ? { ...route, name } : route,
              ),
            ),
          onRetry: () => undefined,
          onSave: async () => undefined,
        }}
        unit="mi"
        onClose={() => undefined}
        onUseRoute={(route) =>
          setUsedRoute(
            routes.find((item) => item.route === route)?.name ?? 'Saved route',
          )
        }
      />
      {usedRoute ? <p role="status">Using {usedRoute}</p> : null}
    </>
  )
}
