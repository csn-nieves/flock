import type { Tables } from '@src/types/database'

import { supabase } from './supabase'

export type FlockSummary = Pick<Tables<'flocks'>, 'id' | 'name' | 'owner_id'>

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
