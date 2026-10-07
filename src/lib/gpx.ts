import type { EventRoute, RouteCoordinate } from '@src/types/events'

export const MAX_GPX_FILE_BYTES = 2 * 1024 * 1024
export const MAX_ROUTE_COORDINATES = 1000
const MAX_SOURCE_COORDINATES = 50_000
const EARTH_RADIUS_METERS = 6_371_000

export class GpxParseError extends Error {}

function radians(value: number) {
  return (value * Math.PI) / 180
}

function segmentDistance(
  [fromLongitude, fromLatitude]: RouteCoordinate,
  [toLongitude, toLatitude]: RouteCoordinate,
) {
  const latitudeDelta = radians(toLatitude - fromLatitude)
  const longitudeDelta = radians(toLongitude - fromLongitude)
  const fromLatitudeRadians = radians(fromLatitude)
  const toLatitudeRadians = radians(toLatitude)
  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(fromLatitudeRadians) *
      Math.cos(toLatitudeRadians) *
      Math.sin(longitudeDelta / 2) ** 2
  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.sqrt(haversine))
}

export function routeDistanceMeters(coordinates: readonly RouteCoordinate[]) {
  return coordinates.slice(1).reduce((distance, coordinate, index) => {
    return distance + segmentDistance(coordinates[index], coordinate)
  }, 0)
}

function pointToSegmentDistance(
  point: RouteCoordinate,
  start: RouteCoordinate,
  end: RouteCoordinate,
) {
  const latitudeScale = Math.cos(radians((start[1] + end[1]) / 2))
  const pointX = point[0] * latitudeScale
  const pointY = point[1]
  const startX = start[0] * latitudeScale
  const startY = start[1]
  const endX = end[0] * latitudeScale
  const endY = end[1]
  const deltaX = endX - startX
  const deltaY = endY - startY
  const lengthSquared = deltaX ** 2 + deltaY ** 2
  const progress = lengthSquared
    ? Math.max(
        0,
        Math.min(
          1,
          ((pointX - startX) * deltaX + (pointY - startY) * deltaY) /
            lengthSquared,
        ),
      )
    : 0
  return Math.hypot(
    pointX - (startX + progress * deltaX),
    pointY - (startY + progress * deltaY),
  )
}

function simplify(
  coordinates: readonly RouteCoordinate[],
  tolerance: number,
): RouteCoordinate[] {
  if (coordinates.length <= 2) return [...coordinates]
  const keep = new Uint8Array(coordinates.length)
  keep[0] = 1
  keep[coordinates.length - 1] = 1
  const segments: Array<[number, number]> = [[0, coordinates.length - 1]]

  while (segments.length) {
    const [startIndex, endIndex] = segments.pop()!
    let greatestDistance = 0
    let greatestIndex = 0
    for (let index = startIndex + 1; index < endIndex; index += 1) {
      const distance = pointToSegmentDistance(
        coordinates[index],
        coordinates[startIndex],
        coordinates[endIndex],
      )
      if (distance > greatestDistance) {
        greatestDistance = distance
        greatestIndex = index
      }
    }
    if (greatestDistance > tolerance) {
      keep[greatestIndex] = 1
      segments.push([startIndex, greatestIndex], [greatestIndex, endIndex])
    }
  }

  return coordinates.filter((_, index) => keep[index])
}

export function boundRouteCoordinates(coordinates: RouteCoordinate[]) {
  if (coordinates.length <= MAX_ROUTE_COORDINATES) return coordinates
  let lowerTolerance = 0
  let upperTolerance = 1
  while (simplify(coordinates, upperTolerance).length > MAX_ROUTE_COORDINATES) {
    upperTolerance *= 2
  }
  let result = coordinates
  for (let attempt = 0; attempt < 24; attempt += 1) {
    const tolerance = (lowerTolerance + upperTolerance) / 2
    const candidate = simplify(coordinates, tolerance)
    if (candidate.length > MAX_ROUTE_COORDINATES) {
      lowerTolerance = tolerance
    } else {
      upperTolerance = tolerance
      result = candidate
    }
  }
  return result
}

function coordinatesFromElements(
  elements: Iterable<Element>,
): RouteCoordinate[] {
  return [...elements].map((element) => {
    const latitude = Number(element.getAttribute('lat'))
    const longitude = Number(element.getAttribute('lon'))
    if (
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude) ||
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {
      throw new GpxParseError('The GPX file contains an invalid coordinate.')
    }
    return [longitude, latitude]
  })
}

export function parseGpxText(text: string): EventRoute {
  const document = new DOMParser().parseFromString(text, 'application/xml')
  if (document.querySelector('parsererror')) {
    throw new GpxParseError('This file is not valid GPX XML.')
  }
  const trackSegments = [...document.querySelectorAll('trkseg')]
  const candidates = trackSegments.map((segment) =>
    coordinatesFromElements(segment.querySelectorAll('trkpt')),
  )
  const routePoints = coordinatesFromElements(
    document.querySelectorAll('rtept'),
  )
  if (routePoints.length) candidates.push(routePoints)
  const coordinates = candidates.sort((a, b) => b.length - a.length)[0] ?? []
  if (coordinates.length < 2) {
    throw new GpxParseError('The GPX file needs at least two route points.')
  }
  if (coordinates.length > MAX_SOURCE_COORDINATES) {
    throw new GpxParseError('The GPX route contains too many points.')
  }
  const distanceMeters = Math.round(routeDistanceMeters(coordinates))
  if (distanceMeters < 1 || distanceMeters > 1_000_000) {
    throw new GpxParseError(
      'The GPX route distance is outside the supported range.',
    )
  }
  return {
    coordinates: boundRouteCoordinates(coordinates),
    distanceMeters,
  }
}

export async function parseGpxFile(file: File) {
  if (file.size > MAX_GPX_FILE_BYTES) {
    throw new GpxParseError('Choose a GPX file smaller than 2 MB.')
  }
  return parseGpxText(await file.text())
}
