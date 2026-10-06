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
  id: string
  paceLabel: string
  position: number
}

export type EventRunOptionInput = {
  distanceLabel: string
  paceLabel: string
  id?: string
}

export type EventInput = {
  description: string
  location: string
  startsAt: string
  title: string
}

export type EventFormInput = EventInput & {
  runOptions?: EventRunOptionInput[]
}

export type CreateFlockEventInput = EventInput & {
  runOptions: EventRunOptionInput[]
}
