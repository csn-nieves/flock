import type { Profile } from '@src/types/profile'

import { supabase } from './supabase'

function toProfile(row: {
  display_name: string
  location: string | null
  updated_at: string
  user_id: string
}): Profile {
  return {
    displayName: row.display_name,
    location: row.location,
    updatedAt: row.updated_at,
    userId: row.user_id,
  }
}

export async function getMyProfile(): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .select('user_id, display_name, location, updated_at')
    .single()

  if (error) {
    throw error
  }

  return toProfile(data)
}

export async function updateMyProfile(input: {
  displayName: string
  location: string | null
}): Promise<Profile> {
  const { data, error } = await supabase.rpc('update_my_profile', {
    next_display_name: input.displayName,
    next_location: input.location ?? undefined,
  })

  if (error) {
    throw error
  }

  const profile = data[0]

  if (!profile) {
    throw new Error('The profile update did not return a profile.')
  }

  return toProfile(profile)
}
