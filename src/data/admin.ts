import { supabase } from './supabase'

export const ADMIN_EVENTS_PAGE_SIZE = 20

export type AdminEvent = {
  canceledAt: string | null
  createdBy: string
  flockName: string | null
  id: string
  location: string
  startsAt: string
  title: string
}

export type AdminEventPage = {
  events: AdminEvent[]
  totalCount: number
}

export type AdminFlock = { id: string; name: string; owner_id: string }
export type AdminUser = { user_id: string; display_name: string }

export async function listAdminEvents(page: number): Promise<AdminEventPage> {
  const firstRow = (page - 1) * ADMIN_EVENTS_PAGE_SIZE
  const lastRow = firstRow + ADMIN_EVENTS_PAGE_SIZE - 1
  const { count, data, error } = await supabase
    .from('flock_events')
    .select(
      'id, created_by, title, starts_at, location, canceled_at, flocks(name)',
      { count: 'exact' },
    )
    .order('starts_at', { ascending: false })
    .range(firstRow, lastRow)

  if (error) throw error

  return {
    events: data.map((event) => ({
      canceledAt: event.canceled_at,
      createdBy: event.created_by,
      flockName: event.flocks?.name ?? null,
      id: event.id,
      location: event.location,
      startsAt: event.starts_at,
      title: event.title,
    })),
    totalCount: count ?? data.length,
  }
}

export async function listAdminFlocks(): Promise<AdminFlock[]> {
  const { data, error } = await supabase
    .from('flocks')
    .select('id, name, owner_id')
    .order('name', { ascending: true })
  if (error) throw error
  return data
}

export async function listAdminUsers(): Promise<AdminUser[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('user_id, display_name')
    .order('display_name', { ascending: true })
  if (error) throw error
  return data
}

export async function deleteAdminFlock(flockId: string): Promise<void> {
  const { error } = await supabase.from('flocks').delete().eq('id', flockId)
  if (error) throw error
}

export async function cancelAdminEvent(eventId: string): Promise<void> {
  const { error } = await supabase.rpc('cancel_flock_event', {
    target_event_id: eventId,
  })
  if (error) throw error
}
