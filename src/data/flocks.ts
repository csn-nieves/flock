import type { Tables, TablesInsert } from '@src/types/database'

import { supabase } from './supabase'

export type FlockSummary = Pick<Tables<'flocks'>, 'id' | 'name' | 'owner_id'>
export type CreateFlockInput = Pick<TablesInsert<'flocks'>, 'name'>

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
