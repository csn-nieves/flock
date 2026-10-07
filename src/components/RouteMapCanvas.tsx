import { useEffect, useRef, useState } from 'react'
import { LngLatBounds, Map, NavigationControl, setWorkerUrl } from 'maplibre-gl'
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'
import 'maplibre-gl/dist/maplibre-gl.css'

import type { EventRoute } from '@src/types/events'

setWorkerUrl(workerUrl)

type RouteMapCanvasProps = {
  route: EventRoute
}

function RouteMapCanvas({ route }: RouteMapCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [loadError, setLoadError] = useState(false)

  useEffect(() => {
    if (!containerRef.current) return
    setLoadError(false)
    const accentColor = getComputedStyle(containerRef.current)
      .getPropertyValue('--flock-color-accent')
      .trim()
    const backgroundColor = getComputedStyle(containerRef.current)
      .getPropertyValue('--flock-color-background')
      .trim()
    const map = new Map({
      attributionControl: {},
      container: containerRef.current,
      style: 'https://tiles.openfreemap.org/styles/liberty',
    })
    map.addControl(new NavigationControl({ showCompass: false }), 'top-right')
    map.on('error', () => setLoadError(true))
    map.on('load', () => {
      map.addSource('event-route', {
        data: {
          geometry: {
            coordinates: route.coordinates,
            type: 'LineString',
          },
          properties: {},
          type: 'Feature',
        },
        type: 'geojson',
      })
      map.addLayer({
        id: 'event-route-outline',
        paint: {
          'line-color': backgroundColor,
          'line-opacity': 0.92,
          'line-width': 7,
        },
        source: 'event-route',
        type: 'line',
      })
      map.addLayer({
        id: 'event-route',
        paint: {
          'line-color': accentColor,
          'line-width': 4,
        },
        source: 'event-route',
        type: 'line',
      })
      const bounds = route.coordinates.reduce(
        (currentBounds, coordinate) => currentBounds.extend(coordinate),
        new LngLatBounds(route.coordinates[0], route.coordinates[0]),
      )
      map.fitBounds(bounds, { maxZoom: 16, padding: 36 })
    })
    return () => map.remove()
  }, [route])

  return (
    <>
      <div
        aria-label="Event route map"
        className="h-64 w-full overflow-hidden rounded-lg border border-border bg-surface-subtle"
        ref={containerRef}
        role="group"
      />
      {loadError ? (
        <p className="mt-2 mb-0 text-sm text-text-muted" role="status">
          The map background could not load. Your route is still saved.
        </p>
      ) : null}
    </>
  )
}

export default RouteMapCanvas
