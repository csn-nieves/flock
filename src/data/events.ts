import type { CreateFlockEventInput, FlockEvent } from '@src/types/events'
import { supabase } from './supabase'

const eventFields =
  'id, flock_id, title, starts_at, location, description, created_at'

function toEvent(row: {
  created_at: string
  description: string
  flock_id: string
  id: string
  location: string
  starts_at: string
  title: string
}): FlockEvent {
  return {
    createdAt: row.created_at,
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
    .order('starts_at', { ascending: true })
  if (error) throw error
  return data.map(toEvent)
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
  return toEvent(data)
}
