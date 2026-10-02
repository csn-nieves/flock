import type {
  CreateFlockEventInput,
  EventResponse,
  FlockEvent,
} from '@src/types/events'
import { supabase } from './supabase'

const eventFields =
  'id, flock_id, created_by, title, starts_at, location, description, created_at, canceled_at'

function toEvent(row: {
  created_at: string
  canceled_at?: string | null
  created_by: string
  description: string
  flock_id: string | null
  id: string
  location: string
  starts_at: string
  title: string
}): FlockEvent {
  return {
    attendance: { in: 0, maybe: 0, out: 0, response: null },
    canceledAt: row.canceled_at ?? null,
    createdAt: row.created_at,
    createdBy: row.created_by,
    description: row.description,
    flockId: row.flock_id,
    id: row.id,
    location: row.location,
    startsAt: row.starts_at,
    title: row.title,
  }
}

export async function listFlockEvents(flockId: string): Promise<FlockEvent[]> {
  const { data, error } = await supabase
    .from('flock_events')
    .select(eventFields)
    .eq('flock_id', flockId)
    .gte('starts_at', new Date().toISOString())
    .is('canceled_at', null)
    .order('starts_at', { ascending: true })
  if (error) throw error
  const events = data.map(toEvent)
  if (events.length === 0) return events
  const { data: attendance, error: attendanceError } = await supabase
    .from('flock_event_attendance')
    .select('event_id, user_id, response')
    .in(
      'event_id',
      events.map((event) => event.id),
    )
  if (attendanceError) throw attendanceError
  const { data: userData } = await supabase.auth.getSession()
  return events.map((event) => {
    const responses = attendance.filter((item) => item.event_id === event.id)
    return {
      ...event,
      attendance: {
        in: responses.filter((item) => item.response === 'in').length,
        maybe: responses.filter((item) => item.response === 'maybe').length,
        out: responses.filter((item) => item.response === 'out').length,
        response:
          (responses.find((item) => item.user_id === userData.session?.user.id)
            ?.response as EventResponse | undefined) ?? null,
      },
    }
  })
}

export async function cancelFlockEvent(eventId: string): Promise<void> {
  const { error } = await supabase.rpc('cancel_flock_event', {
    target_event_id: eventId,
  })
  if (error) throw error
}

export async function setFlockEventResponse(
  eventId: string,
  response: EventResponse,
) {
  const { data, error } = await supabase.rpc('set_flock_event_response', {
    target_event_id: eventId,
    next_response: response,
  })
  if (error) throw error
  return data
}

export async function createFlockEvent(
  flockId: string,
  input: CreateFlockEventInput,
): Promise<FlockEvent> {
  const { data, error } = await supabase.rpc('create_flock_event', {
    target_flock_id: flockId,
    event_title: input.title,
    event_starts_at: input.startsAt,
    event_location: input.location,
    event_description: input.description,
  })
  if (error) throw error
  const event = Array.isArray(data) ? data[0] : data
  if (!event) throw new Error('The event creation did not return an event.')
  return toEvent(event)
}

export async function updateFlockEvent(
  eventId: string,
  input: CreateFlockEventInput,
): Promise<FlockEvent> {
  const { data, error } = await supabase.rpc('update_flock_event', {
    target_event_id: eventId,
    event_title: input.title,
    event_starts_at: input.startsAt,
    event_location: input.location,
    event_description: input.description,
  })
  if (error) throw error
  const event = Array.isArray(data) ? data[0] : data
  if (!event) throw new Error('The event update did not return an event.')
  return toEvent(event)
}
