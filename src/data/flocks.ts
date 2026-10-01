import type { CreateFlockInput, FlockSummary } from '@src/types/flocks'

import { supabase } from './supabase'

export async function createFlock({
  name,
}: CreateFlockInput): Promise<FlockSummary> {
  const { data, error } = await supabase
    .from('flocks')
    .insert({ name })
    .select('id, name, owner_id')
    .single()

  if (error) {
    throw error
  }

  return data
}

export async function listFlocks(): Promise<FlockSummary[]> {
  const { data, error } = await supabase
    .from('flocks')
    .select('id, name, owner_id')
    .order('name', { ascending: true })

  if (error) {
    throw error
  }

  return data
}

export async function getFlock(flockId: string): Promise<FlockSummary | null> {
  const { data, error } = await supabase
    .from('flocks')
    .select('id, name, owner_id')
    .eq('id', flockId)
    .maybeSingle()

  if (error) {
    throw error
  }

  return data
}
