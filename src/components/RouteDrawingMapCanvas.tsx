import { useEffect, useRef, useState } from 'react'
import type { Feature, FeatureCollection } from 'geojson'
import {
  GeoJSONSource,
  Map,
  NavigationControl,
  setWorkerUrl,
  type MapMouseEvent,
} from 'maplibre-gl'
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'
import 'maplibre-gl/dist/maplibre-gl.css'

import Button from '@src/primitives/Button'
import type { EventRoute, RouteCoordinate } from '@src/types/events'

setWorkerUrl(workerUrl)

const DEFAULT_CENTER: RouteCoordinate = [-98.5795, 39.8283]

type RouteDrawingMapCanvasProps = {
  isPlanning: boolean
  onAddPoint: (coordinate: RouteCoordinate) => void
  route: EventRoute | undefined
  waypoints: readonly RouteCoordinate[]
  initialCenter?: RouteCoordinate
}

function mapData(
  route: EventRoute | undefined,
  waypoints: readonly RouteCoordinate[],
): FeatureCollection {
  const features: Feature[] = waypoints.map((coordinate, index) => ({
    geometry: { coordinates: coordinate, type: 'Point' },
    properties: { index: index + 1 },
    type: 'Feature',
  }))
  if (route) {
    features.unshift({
      geometry: { coordinates: route.coordinates, type: 'LineString' },
      properties: {},
      type: 'Feature',
    })
  }
  return { features, type: 'FeatureCollection' }
}

function RouteDrawingMapCanvas({
  initialCenter,
  isPlanning,
  onAddPoint,
  route,
  waypoints,
}: RouteDrawingMapCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<Map | undefined>(undefined)
  const initialCenterRef = useRef(initialCenter)
  const latestDataRef = useRef(mapData(route, waypoints))
  const onAddPointRef = useRef(onAddPoint)
  const [center, setCenter] = useState<RouteCoordinate>(
    initialCenter ?? DEFAULT_CENTER,
  )
  const [loadError, setLoadError] = useState(false)

  useEffect(() => {
    onAddPointRef.current = onAddPoint
  }, [onAddPoint])

  useEffect(() => {
    latestDataRef.current = mapData(route, waypoints)
  }, [route, waypoints])

  useEffect(() => {
    if (!containerRef.current) return
    const accentColor = getComputedStyle(containerRef.current)
      .getPropertyValue('--flock-color-accent')
      .trim()
    const backgroundColor = getComputedStyle(containerRef.current)
      .getPropertyValue('--flock-color-background')
      .trim()
    const textColor = getComputedStyle(containerRef.current)
      .getPropertyValue('--flock-color-text')
      .trim()
    const map = new Map({
      attributionControl: {},
      center: initialCenterRef.current ?? DEFAULT_CENTER,
      container: containerRef.current,
      keyboard: true,
      style: 'https://tiles.openfreemap.org/styles/liberty',
      zoom: initialCenterRef.current ? 13 : 3,
    })
    mapRef.current = map
    map.addControl(new NavigationControl({ showCompass: false }), 'top-right')
    map.on('error', () => setLoadError(true))
    map.on('moveend', () => {
      const nextCenter = map.getCenter()
      setCenter([nextCenter.lng, nextCenter.lat])
    })
    map.on('click', (event: MapMouseEvent) => {
      onAddPointRef.current([event.lngLat.lng, event.lngLat.lat])
    })
    map.on('load', () => {
      map.addSource('draft-route', {
        data: latestDataRef.current,
        type: 'geojson',
      })
      map.addLayer({
        filter: ['==', '$type', 'LineString'],
        id: 'draft-route-outline',
        paint: {
          'line-color': backgroundColor,
          'line-opacity': 0.92,
          'line-width': 7,
        },
        source: 'draft-route',
        type: 'line',
      })
      map.addLayer({
        filter: ['==', '$type', 'LineString'],
        id: 'draft-route-line',
        paint: { 'line-color': accentColor, 'line-width': 4 },
        source: 'draft-route',
        type: 'line',
      })
      map.addLayer({
        filter: ['==', '$type', 'Point'],
        id: 'draft-route-points',
        paint: {
          'circle-color': backgroundColor,
          'circle-radius': 7,
          'circle-stroke-color': textColor,
          'circle-stroke-width': 3,
        },
        source: 'draft-route',
        type: 'circle',
      })
    })
    return () => {
      mapRef.current = undefined
      map.remove()
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !initialCenter) return
    map.jumpTo({ center: initialCenter, zoom: 13 })
    setCenter(initialCenter)
  }, [initialCenter])

  useEffect(() => {
    const source = mapRef.current?.getSource('draft-route')
    if (source instanceof GeoJSONSource) {
      source.setData(mapData(route, waypoints))
    }
  }, [route, waypoints])

  return (
    <>
      <div
        aria-label="Route drawing map. Click the map to add a point, or pan the map and use Add point at map center."
        className="h-72 w-full cursor-crosshair overflow-hidden rounded-lg border border-border bg-surface-subtle sm:h-[26rem]"
        ref={containerRef}
        role="group"
      />
      <Button
        className="mt-2 w-full"
        disabled={isPlanning}
        type="button"
        variant="secondary"
        onClick={() => onAddPoint(center)}
      >
        Add point at map center
      </Button>
      {loadError ? (
        <p className="mt-2 mb-0 text-sm text-text-muted" role="status">
          The map background could not load. Check your connection before adding
          another point.
        </p>
      ) : null}
    </>
  )
}

export default RouteDrawingMapCanvas
