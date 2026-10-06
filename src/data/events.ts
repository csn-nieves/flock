import type {
  CreateFlockEventInput,
  EventAttendanceGroup,
  EventInput,
  EventResponse,
  EventRunOption,
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
    attendance: {
      groups: [],
      in: 0,
      maybe: 0,
      out: 0,
      response: null,
      runOptionId: null,
    },
    canceledAt: row.canceled_at ?? null,
    createdAt: row.created_at,
    createdBy: row.created_by,
    description: row.description,
    flockId: row.flock_id,
    id: row.id,
    location: row.location,
    runOptions: [],
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
  const eventIds = events.map((event) => event.id)
  const [attendanceResult, optionsResult] = await Promise.all([
    supabase
      .from('flock_event_attendance')
      .select('event_id, user_id, response, run_option_id')
      .in('event_id', eventIds),
    supabase
      .from('flock_event_run_options')
      .select('id, event_id, distance_label, pace_label, position')
      .in('event_id', eventIds)
      .order('position', { ascending: true }),
  ])
  const { data: attendance, error: attendanceError } = attendanceResult
  if (attendanceError) throw attendanceError
  const { data: options, error: optionsError } = optionsResult
  if (optionsError) throw optionsError
  const { data: userData } = await supabase.auth.getSession()
  return events.map((event) => {
    const responses = attendance.filter((item) => item.event_id === event.id)
    const runOptions: EventRunOption[] = options
      .filter((option) => option.event_id === event.id)
      .map((option) => ({
        distanceLabel: option.distance_label,
        id: option.id,
        paceLabel: option.pace_label,
        position: option.position,
      }))
    const groupedResponses = new Map<string | null, EventAttendanceGroup>()
    for (const response of responses) {
      if (response.response === 'out') continue
      const current = groupedResponses.get(response.run_option_id) ?? {
        in: 0,
        maybe: 0,
        runOptionId: response.run_option_id,
      }
      current[response.response] += 1
      groupedResponses.set(response.run_option_id, current)
    }
    const ownResponse = responses.find(
      (item) => item.user_id === userData.session?.user.id,
    )
    return {
      ...event,
      attendance: {
        groups: [...groupedResponses.values()],
        in: responses.filter((item) => item.response === 'in').length,
        maybe: responses.filter((item) => item.response === 'maybe').length,
        out: responses.filter((item) => item.response === 'out').length,
        response: (ownResponse?.response as EventResponse | undefined) ?? null,
        runOptionId: ownResponse?.run_option_id ?? null,
      },
      runOptions,
    }
  })
}

export async function listUserEvents(): Promise<FlockEvent[]> {
  const { data, error } = await supabase
    .from('flock_events')
    .select(eventFields)
    .is('flock_id', null)
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
        groups: [],
        in: responses.filter((item) => item.response === 'in').length,
        maybe: responses.filter((item) => item.response === 'maybe').length,
        out: responses.filter((item) => item.response === 'out').length,
        response:
          (responses.find((item) => item.user_id === userData.session?.user.id)
            ?.response as EventResponse | undefined) ?? null,
        runOptionId: null,
      },
    }
  })
}

export async function createUserEvent(input: EventInput): Promise<FlockEvent> {
  const { data, error } = await supabase.rpc('create_user_event', {
    event_title: input.title,
    event_starts_at: input.startsAt,
    event_location: input.location,
    event_description: input.description,
  })
  if (error) throw error
  if (!data) throw new Error('The event creation did not return an event.')
  return toEvent(data)
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
  runOptionId: string | null,
) {
  const { data, error } = await supabase.rpc('set_flock_event_response', {
    target_event_id: eventId,
    next_response: response,
    // Generated RPC args cannot express a nullable PostgreSQL parameter.
    target_run_option_id: runOptionId!,
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
    event_run_options: input.runOptions,
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
    event_run_options: input.runOptions,
  })
  if (error) throw error
  const event = Array.isArray(data) ? data[0] : data
  if (!event) throw new Error('The event update did not return an event.')
  return toEvent(event)
}

export async function updateUserEvent(
  eventId: string,
  input: EventInput,
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
