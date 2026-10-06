import type {
  CreateFlockInput,
  FlockSummary,
  UpdateFlockInput,
} from '@src/types/flocks'

import { supabase } from './supabase'

const flockSummaryColumns = 'description, id, location, name, owner_id'

export async function createFlock(
  input: CreateFlockInput,
): Promise<FlockSummary> {
  const { data, error } = await supabase
    .from('flocks')
    .insert(input)
    .select(flockSummaryColumns)
    .single()

  if (error) {
    throw error
  }

  return data
}

export async function listFlocks(): Promise<FlockSummary[]> {
  const { data, error } = await supabase
    .from('flocks')
    .select(flockSummaryColumns)
    .order('name', { ascending: true })

  if (error) {
    throw error
  }

  return data
}

export async function getFlock(flockId: string): Promise<FlockSummary | null> {
  const { data, error } = await supabase
    .from('flocks')
    .select(flockSummaryColumns)
    .eq('id', flockId)
    .maybeSingle()

  if (error) {
    throw error
  }

  return data
}

export async function updateFlock({
  description,
  flockId,
  location,
  name,
}: UpdateFlockInput): Promise<FlockSummary> {
  const { data, error } = await supabase
    .from('flocks')
    .update({ description, location, name })
    .eq('id', flockId)
    .select(flockSummaryColumns)
    .single()

  if (error) {
    throw error
  }

  return data
}
