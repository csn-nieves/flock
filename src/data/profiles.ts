import type { Profile } from '@src/types/profile'

import { getImageUrl, profileImagePath } from './media'
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
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError) {
    throw authError
  }

  if (!user) {
    throw new Error('An authenticated runner is required to load a profile.')
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('user_id, display_name, location, updated_at')
    .eq('user_id', user.id)
    .single()

  if (error) {
    throw error
  }

  const profile = toProfile(data)
  const avatarUrl = await getImageUrl(
    profileImagePath(user.id),
    profile.displayName,
  )
  if (avatarUrl) profile.avatarUrl = avatarUrl
  return profile
}

export async function getRunnerProfile(userId: string): Promise<Profile> {
  const { data, error } = await supabase.rpc('get_runner_profile', {
    target_user_id: userId,
  })

  if (error) throw error

  const profile = data[0]
  if (!profile) throw new Error('That runner profile is unavailable.')

  const avatarUrl = await getImageUrl(
    profileImagePath(profile.user_id),
    profile.display_name,
  )
  return {
    ...toProfile(profile),
    ...(avatarUrl ? { avatarUrl } : {}),
  }
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

  const avatarUrl = await getImageUrl(
    profileImagePath(profile.user_id),
    profile.display_name,
  )
  return { ...toProfile(profile), ...(avatarUrl ? { avatarUrl } : {}) }
}
