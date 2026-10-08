import { boundRouteCoordinates } from '@src/lib/gpx'
import type { EventRoute, RouteCoordinate } from '@src/types/events'

const GEOAPIFY_ROUTING_URL = 'https://api.geoapify.com/v1/routing'
const GEOAPIFY_GEOCODING_URL = 'https://api.geoapify.com/v1/geocode/search'

export class RoutePlanningError extends Error {}

function apiKey() {
  return import.meta.env.VITE_GEOAPIFY_API_KEY?.trim()
}

export function isRoutePlanningConfigured() {
  return Boolean(apiKey())
}

function isCoordinate(value: unknown): value is RouteCoordinate {
  return (
    Array.isArray(value) &&
    value.length >= 2 &&
    typeof value[0] === 'number' &&
    Number.isFinite(value[0]) &&
    value[0] >= -180 &&
    value[0] <= 180 &&
    typeof value[1] === 'number' &&
    Number.isFinite(value[1]) &&
    value[1] >= -90 &&
    value[1] <= 90
  )
}

function routeCoordinates(geometry: unknown): RouteCoordinate[] {
  if (!geometry || typeof geometry !== 'object') return []
  const candidate = geometry as { coordinates?: unknown; type?: unknown }
  if (candidate.type === 'LineString' && Array.isArray(candidate.coordinates)) {
    return candidate.coordinates.filter(isCoordinate)
  }
  if (
    candidate.type === 'MultiLineString' &&
    Array.isArray(candidate.coordinates)
  ) {
    const lines = candidate.coordinates.filter(Array.isArray)
    return lines.flatMap((line, index) => {
      const coordinates = line.filter(isCoordinate)
      return index === 0 ? coordinates : coordinates.slice(1)
    })
  }
  return []
}

function responseError(status: number) {
  if (status === 429) {
    return new RoutePlanningError(
      'Route planning is busy right now. Wait a moment, then try that point again.',
    )
  }
  return new RoutePlanningError(
    'We could not plan that part of the route. Try a point on a nearby road.',
  )
}

export async function planWalkingSegment(
  from: RouteCoordinate,
  to: RouteCoordinate,
  signal?: AbortSignal,
): Promise<EventRoute> {
  const key = apiKey()
  if (!key) {
    throw new RoutePlanningError(
      'Road-following route drawing is not configured for this environment.',
    )
  }
  const query = new URLSearchParams({
    apiKey: key,
    mode: 'walk',
    type: 'short',
    waypoints: `${from[1]},${from[0]}|${to[1]},${to[0]}`,
  })
  let response: Response
  try {
    response = await fetch(`${GEOAPIFY_ROUTING_URL}?${query}`, { signal })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError')
      throw error
    throw new RoutePlanningError(
      'We could not reach route planning. Check your connection and try again.',
    )
  }
  if (!response.ok) throw responseError(response.status)

  const body = (await response.json()) as {
    features?: Array<{
      geometry?: unknown
      properties?: { distance?: unknown }
    }>
  }
  const feature = body.features?.[0]
  const coordinates = routeCoordinates(feature?.geometry)
  const distance = feature?.properties?.distance
  if (
    coordinates.length < 2 ||
    typeof distance !== 'number' ||
    !Number.isFinite(distance) ||
    distance < 1 ||
    distance > 1_000_000
  ) {
    throw new RoutePlanningError(
      'No walkable route was found between those points. Try a point on a nearby road.',
    )
  }
  return {
    coordinates: boundRouteCoordinates(coordinates),
    distanceMeters: Math.round(distance),
  }
}

export async function findRouteCenter(
  location: string,
  signal?: AbortSignal,
): Promise<RouteCoordinate | undefined> {
  const key = apiKey()
  if (!key || !location.trim()) return undefined
  const query = new URLSearchParams({
    apiKey: key,
    format: 'json',
    limit: '1',
    text: location.trim(),
  })
  let response: Response
  try {
    response = await fetch(`${GEOAPIFY_GEOCODING_URL}?${query}`, { signal })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError')
      throw error
    return undefined
  }
  if (!response.ok) return undefined
  const body = (await response.json()) as {
    results?: Array<{ lat?: unknown; lon?: unknown }>
  }
  const result = body.results?.[0]
  const coordinate = [result?.lon, result?.lat]
  return isCoordinate(coordinate) ? coordinate : undefined
}
