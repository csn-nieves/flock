import type {
  CreateFlockEventInput,
  EventAttendanceGroup,
  EventRecurrenceInput,
  EventRunOptionInput,
  EventResponse,
  EventRunOption,
  EventWithRunOptionsInput,
  FlockEvent,
  RouteCoordinate,
} from '@src/types/events'
import { supabase } from './supabase'
import { eventImagePath, getImageUrl, uploadImage } from './media'

const browserTimeZone = () =>
  Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'

const eventFields =
  'id, flock_id, created_by, title, starts_at, time_zone, reminders_enabled, location, description, created_at, canceled_at, series_id, series_position'
const legacyEventFields =
  'id, flock_id, created_by, title, starts_at, location, description, created_at, canceled_at'

type EventRow = {
  canceled_at?: string | null
  created_at: string
  created_by: string
  description: string
  flock_id: string | null
  id: string
  location: string
  starts_at: string
  series_id?: string | null
  series_position?: number | null
  time_zone?: string | null
  title: string
}

function isMissingEventColumn(error: { code?: string; message?: string }) {
  return (
    error.code === '42703' ||
    error.message?.toLocaleLowerCase().includes('column') === true
  )
}

async function listEvents(
  configure: (
    query: ReturnType<typeof supabase.from>,
  ) => ReturnType<typeof supabase.from>,
): Promise<{
  data: EventRow[] | null
  error: { code?: string; message?: string } | null
}> {
  const primaryResult = await configure(
    supabase.from('flock_events').select(eventFields),
  )
  if (!primaryResult.error || !isMissingEventColumn(primaryResult.error)) {
    return primaryResult as unknown as {
      data: EventRow[] | null
      error: { code?: string; message?: string } | null
    }
  }

  return (await configure(
    supabase.from('flock_events').select(legacyEventFields),
  )) as unknown as {
    data: EventRow[] | null
    error: { code?: string; message?: string } | null
  }
}

function serializeRunOptions(runOptions: readonly EventRunOptionInput[]) {
  return runOptions.map(({ distanceTenths, id, paceSeconds, route, unit }) => ({
    distanceTenths,
    ...(id ? { id } : {}),
    ...(paceSeconds === null ? {} : { paceSeconds }),
    ...(route
      ? {
          routeCoordinates: route.coordinates,
          routeDistanceMeters: route.distanceMeters,
        }
      : {}),
    unit,
  }))
}

function toEvent(row: {
  created_at: string
  canceled_at?: string | null
  created_by: string
  description: string
  flock_id: string | null
  id: string
  location: string
  starts_at: string
  series_id?: string | null
  series_position?: number | null
  time_zone?: string | null
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
    imageUrl: null,
    location: row.location,
    runOptions: [],
    seriesId: row.series_id ?? null,
    seriesPosition: row.series_position ?? null,
    startsAt: row.starts_at,
    timeZone: row.time_zone ?? null,
    title: row.title,
  }
}

export async function listFlockEvents(flockId: string): Promise<FlockEvent[]> {
  const { data, error } = await listEvents((query) =>
    query
      .eq('flock_id', flockId)
      .gte('starts_at', new Date().toISOString())
      .is('canceled_at', null)
      .order('starts_at', { ascending: true }),
  )
  if (error) throw error
  const events = (data ?? []).map(toEvent)
  if (events.length === 0) return events
  const eventIds = events.map((event) => event.id)
  const [attendanceResult, optionsResult] = await Promise.all([
    supabase
      .from('flock_event_attendance')
      .select('event_id, user_id, response, run_option_id')
      .in('event_id', eventIds),
    supabase
      .from('flock_event_run_options')
      .select(
        'id, event_id, distance_label, distance_tenths, distance_unit, pace_label, pace_seconds, pace_unit, position, route_coordinates, route_distance_meters',
      )
      .in('event_id', eventIds)
      .order('position', { ascending: true }),
  ])
  const { data: attendance, error: attendanceError } = attendanceResult
  if (attendanceError) throw attendanceError
  const { data: options, error: optionsError } = optionsResult
  if (optionsError) throw optionsError
  const { data: userData } = await supabase.auth.getSession()
  return Promise.all(
    events.map(async (event) => {
      const responses = attendance.filter((item) => item.event_id === event.id)
      const runOptions: EventRunOption[] = options
        .filter((option) => option.event_id === event.id)
        .map((option) => ({
          distanceLabel: option.distance_label,
          distanceTenths: option.distance_tenths,
          id: option.id,
          paceLabel: option.pace_label,
          paceSeconds: option.pace_seconds,
          position: option.position,
          route:
            option.route_coordinates && option.route_distance_meters
              ? {
                  coordinates: option.route_coordinates as RouteCoordinate[],
                  distanceMeters: option.route_distance_meters,
                }
              : null,
          unit: option.distance_unit as EventRunOption['unit'],
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
      const imageUrl = await getImageUrl(eventImagePath(event.id), event.title)
      return {
        ...event,
        ...(imageUrl ? { imageUrl } : {}),
        attendance: {
          groups: [...groupedResponses.values()],
          in: responses.filter((item) => item.response === 'in').length,
          maybe: responses.filter((item) => item.response === 'maybe').length,
          out: responses.filter((item) => item.response === 'out').length,
          response:
            (ownResponse?.response as EventResponse | undefined) ?? null,
          runOptionId: ownResponse?.run_option_id ?? null,
        },
        runOptions,
      }
    }),
  )
}

export async function listUserEvents(): Promise<FlockEvent[]> {
  const { data, error } = await listEvents((query) =>
    query
      .is('flock_id', null)
      .gte('starts_at', new Date().toISOString())
      .is('canceled_at', null)
      .order('starts_at', { ascending: true }),
  )
  if (error) throw error
  const events = (data ?? []).map(toEvent)
  if (events.length === 0) return events
  const eventIds = events.map((event) => event.id)
  const [attendanceResult, optionsResult] = await Promise.all([
    supabase
      .from('flock_event_attendance')
      .select('event_id, user_id, response, run_option_id')
      .in('event_id', eventIds),
    supabase
      .from('flock_event_run_options')
      .select(
        'id, event_id, distance_label, distance_tenths, distance_unit, pace_label, pace_seconds, pace_unit, position, route_coordinates, route_distance_meters',
      )
      .in('event_id', eventIds)
      .order('position', { ascending: true }),
  ])
  const { data: attendance, error: attendanceError } = attendanceResult
  if (attendanceError) throw attendanceError
  const { data: options, error: optionsError } = optionsResult
  if (optionsError) throw optionsError
  const { data: userData } = await supabase.auth.getSession()
  return Promise.all(
    events.map(async (event) => {
      const responses = attendance.filter((item) => item.event_id === event.id)
      const runOptions: EventRunOption[] = options
        .filter((option) => option.event_id === event.id)
        .map((option) => ({
          distanceLabel: option.distance_label,
          distanceTenths: option.distance_tenths,
          id: option.id,
          paceLabel: option.pace_label,
          paceSeconds: option.pace_seconds,
          position: option.position,
          route:
            option.route_coordinates && option.route_distance_meters
              ? {
                  coordinates: option.route_coordinates as RouteCoordinate[],
                  distanceMeters: option.route_distance_meters,
                }
              : null,
          unit: option.distance_unit as EventRunOption['unit'],
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
      const imageUrl = await getImageUrl(eventImagePath(event.id), event.title)
      return {
        ...event,
        ...(imageUrl ? { imageUrl } : {}),
        attendance: {
          groups: [...groupedResponses.values()],
          in: responses.filter((item) => item.response === 'in').length,
          maybe: responses.filter((item) => item.response === 'maybe').length,
          out: responses.filter((item) => item.response === 'out').length,
          response:
            (ownResponse?.response as EventResponse | undefined) ?? null,
          runOptionId: ownResponse?.run_option_id ?? null,
        },
        runOptions,
      }
    }),
  )
}

export async function getEvent(eventId: string): Promise<FlockEvent | null> {
  const { data, error } = await getEventRow(eventId)
  if (error) throw error
  if (!data) return null

  const visibleEvents = data.flock_id
    ? await listFlockEvents(data.flock_id)
    : await listUserEvents()
  return visibleEvents.find((event) => event.id === eventId) ?? null
}

async function getEventRow(eventId: string): Promise<{
  data: EventRow | null
  error: { code?: string; message?: string } | null
}> {
  const primaryResult = await supabase
    .from('flock_events')
    .select(eventFields)
    .eq('id', eventId)
    .maybeSingle()
  if (!primaryResult.error || !isMissingEventColumn(primaryResult.error)) {
    return primaryResult as unknown as {
      data: EventRow | null
      error: { code?: string; message?: string } | null
    }
  }

  return (await supabase
    .from('flock_events')
    .select(legacyEventFields)
    .eq('id', eventId)
    .maybeSingle()) as unknown as {
    data: EventRow | null
    error: { code?: string; message?: string } | null
  }
}

export async function createUserEvent(
  input: EventWithRunOptionsInput,
): Promise<FlockEvent> {
  const { imageFile, ...eventInput } = input
  const { data, error } = await supabase.rpc('create_user_event', {
    event_title: eventInput.title,
    event_starts_at: eventInput.startsAt,
    event_location: eventInput.location,
    event_description: eventInput.description,
    event_run_options: serializeRunOptions(eventInput.runOptions),
    event_time_zone: eventInput.timeZone ?? browserTimeZone(),
  })
  if (error) throw error
  if (!data) throw new Error('The event creation did not return an event.')
  const event = toEvent(data)
  return {
    ...event,
    imageUrl: imageFile
      ? await uploadImage(eventImagePath(event.id), imageFile)
      : null,
  }
}

export async function createEventSeries(
  flockId: string | null,
  input: EventWithRunOptionsInput,
  recurrence: EventRecurrenceInput,
): Promise<string> {
  const { imageFile, ...eventInput } = input
  void imageFile
  const { data, error } = await supabase.rpc('create_event_series', {
    target_flock_id: flockId!,
    event_title: eventInput.title,
    event_starts_at: eventInput.startsAt,
    event_location: eventInput.location,
    event_description: eventInput.description,
    event_run_options: serializeRunOptions(eventInput.runOptions),
    event_time_zone: eventInput.timeZone ?? browserTimeZone(),
    event_frequency: recurrence.frequency,
    event_interval: recurrence.interval,
    event_weekdays: recurrence.weekdays ?? [],
    event_monthly_mode: recurrence.monthlyMode!,
    event_day_of_month: recurrence.dayOfMonth!,
    event_weekday: recurrence.weekday!,
    event_week_of_month: recurrence.weekOfMonth!,
    event_occurrence_limit: recurrence.occurrenceLimit!,
    event_until_date: recurrence.untilDate!,
  })
  if (error) throw error
  if (!data)
    throw new Error('The recurring event creation did not return a series.')
  return data
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
  const { imageFile, ...eventInput } = input
  const { data, error } = await supabase.rpc('create_flock_event', {
    target_flock_id: flockId,
    event_title: eventInput.title,
    event_starts_at: eventInput.startsAt,
    event_location: eventInput.location,
    event_description: eventInput.description,
    event_run_options: serializeRunOptions(eventInput.runOptions),
    event_time_zone: eventInput.timeZone ?? browserTimeZone(),
  })
  if (error) throw error
  const event = Array.isArray(data) ? data[0] : data
  if (!event) throw new Error('The event creation did not return an event.')
  const createdEvent = toEvent(event)
  return {
    ...createdEvent,
    imageUrl: imageFile
      ? await uploadImage(eventImagePath(createdEvent.id), imageFile)
      : null,
  }
}

export async function updateFlockEvent(
  eventId: string,
  input: CreateFlockEventInput,
): Promise<FlockEvent> {
  const { imageFile, ...eventInput } = input
  const { data, error } = await supabase.rpc('update_flock_event', {
    target_event_id: eventId,
    event_title: eventInput.title,
    event_starts_at: eventInput.startsAt,
    event_location: eventInput.location,
    event_description: eventInput.description,
    event_run_options: serializeRunOptions(eventInput.runOptions),
    event_time_zone: eventInput.timeZone ?? browserTimeZone(),
  })
  if (error) throw error
  const event = Array.isArray(data) ? data[0] : data
  if (!event) throw new Error('The event update did not return an event.')
  const updatedEvent = toEvent(event)
  return {
    ...updatedEvent,
    imageUrl: imageFile
      ? await uploadImage(eventImagePath(updatedEvent.id), imageFile)
      : await getImageUrl(eventImagePath(updatedEvent.id), updatedEvent.title),
  }
}

export async function updateUserEvent(
  eventId: string,
  input: EventWithRunOptionsInput,
): Promise<FlockEvent> {
  const { imageFile, ...eventInput } = input
  const { data, error } = await supabase.rpc('update_flock_event', {
    target_event_id: eventId,
    event_title: eventInput.title,
    event_starts_at: eventInput.startsAt,
    event_location: eventInput.location,
    event_description: eventInput.description,
    event_run_options: serializeRunOptions(eventInput.runOptions),
    event_time_zone: eventInput.timeZone ?? browserTimeZone(),
  })
  if (error) throw error
  const event = Array.isArray(data) ? data[0] : data
  if (!event) throw new Error('The event update did not return an event.')
  const updatedEvent = toEvent(event)
  return {
    ...updatedEvent,
    imageUrl: imageFile
      ? await uploadImage(eventImagePath(updatedEvent.id), imageFile)
      : await getImageUrl(eventImagePath(updatedEvent.id), updatedEvent.title),
  }
}
