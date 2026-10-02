import { supabase } from './supabase'

export type RunnerSearchResult = { user_id: string; display_name: string }
export type FlockSearchResult = { id: string; name: string; owner_id: string }

export async function searchRunners(
  term: string,
): Promise<RunnerSearchResult[]> {
  const { data, error } = await supabase.rpc('search_runners', {
    search_term: term,
  })
  if (error) throw error
  return data
}

export async function searchFlocks(term: string): Promise<FlockSearchResult[]> {
  const { data, error } = await supabase.rpc('search_flocks', {
    search_term: term,
  })
  if (error) throw error
  return data
}
