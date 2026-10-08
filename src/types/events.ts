export type FlockEvent = {
  attendance: {
    groups: readonly EventAttendanceGroup[]
    in: number
    maybe: number
    out: number
    response: EventResponse | null
    runOptionId: string | null
  }
  canceledAt: string | null
  createdAt: string
  createdBy: string
  description: string
  flockId: string | null
  id: string
  imageUrl?: string | null
  location: string
  runOptions: readonly EventRunOption[]
  startsAt: string
  title: string
}

export type EventResponse = 'in' | 'out' | 'maybe'

export type EventAttendanceGroup = {
  in: number
  maybe: number
  runOptionId: string | null
}

export type EventRunOption = {
  distanceLabel: string
  distanceTenths: number | null
  id: string
  paceLabel: string
  paceSeconds: number | null
  position: number
  route?: EventRoute | null
  unit: RunUnit | null
}

export type EventRunOptionInput = {
  distanceTenths: number
  paceSeconds: number | null
  unit: RunUnit
  id?: string
  legacyLabel?: string
  route?: EventRoute
}

export type RouteCoordinate = [longitude: number, latitude: number]

export type EventRoute = {
  coordinates: RouteCoordinate[]
  distanceMeters: number
}

export type RunUnit = 'mi' | 'km'

export type EventInput = {
  description: string
  imageFile?: File
  location: string
  startsAt: string
  title: string
}

export type EventFormInput = EventInput & {
  runOptions?: EventRunOptionInput[]
}

export type EventWithRunOptionsInput = EventInput & {
  runOptions: EventRunOptionInput[]
}

export type CreateFlockEventInput = EventWithRunOptionsInput
