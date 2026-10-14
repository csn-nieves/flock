import { supabase } from './supabase'

export type RunnerSearchResult = {
  user_id: string
  display_name: string
  location?: string | null
}
export type FlockSearchResult = {
  id: string
  name: string
  owner_id: string
  location?: string | null
  description?: string | null
}

export async function searchRunners(
  term: string,
  location = '',
): Promise<RunnerSearchResult[]> {
  const { data, error } = await supabase.rpc('search_runners', {
    location_term: location,
    search_term: term,
  })
  if (error) throw error
  return data
}

export async function searchFlocks(
  term: string,
  location = '',
): Promise<FlockSearchResult[]> {
  const { data, error } = await supabase.rpc('search_flocks', {
    location_term: location,
    search_term: term,
  })
  if (error) throw error
  return data
}
