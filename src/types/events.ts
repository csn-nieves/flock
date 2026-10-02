export type FlockEvent = {
  attendance: {
    in: number
    maybe: number
    out: number
    response: EventResponse | null
  }
  canceledAt: string | null
  createdAt: string
  createdBy: string
  description: string
  flockId: string
  id: string
  location: string
  startsAt: string
  title: string
}

export type EventResponse = 'in' | 'out' | 'maybe'

export type CreateFlockEventInput = {
  description: string
  location: string
  startsAt: string
  title: string
}
