export type FlockEvent = {
  createdAt: string
  description: string
  flockId: string
  id: string
  location: string
  startsAt: string
  title: string
}

export type CreateFlockEventInput = {
  description: string
  location: string
  startsAt: string
  title: string
}
