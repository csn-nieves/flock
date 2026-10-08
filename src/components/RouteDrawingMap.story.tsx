import { useState, type ReactNode } from 'react'

import RouteDrawingMap from './RouteDrawingMap'

function Canvas({ children }: { children: ReactNode }) {
  return <div className="mx-auto w-full max-w-app p-4">{children}</div>
}

export function PlannedRoute() {
  const [addedPoint, setAddedPoint] = useState('No point added')

  return (
    <Canvas>
      <RouteDrawingMap
        initialCenter={[-74.006, 40.7128]}
        isPlanning={false}
        route={{
          coordinates: [
            [-74.006, 40.7128],
            [-74.003, 40.714],
            [-74, 40.716],
          ],
          distanceMeters: 850,
        }}
        waypoints={[
          [-74.006, 40.7128],
          [-74, 40.716],
        ]}
        onAddPoint={(coordinate) =>
          setAddedPoint(
            `${coordinate[1].toFixed(4)}, ${coordinate[0].toFixed(4)}`,
          )
        }
      />
      <output
        className="mt-2 block text-sm text-text"
        data-testid="added-point"
      >
        {addedPoint}
      </output>
    </Canvas>
  )
}
