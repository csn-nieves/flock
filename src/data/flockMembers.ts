import type {
  FlockMemberRole,
  FlockMemberSummary,
} from '@src/types/flockMembers'

import { supabase } from './supabase'

function isFlockMemberRole(role: string): role is FlockMemberRole {
  return role === 'owner' || role === 'member'
}

export async function listFlockMembers(
  flockId: string,
): Promise<FlockMemberSummary[]> {
  const { data, error } = await supabase.rpc('list_flock_members', {
    target_flock_id: flockId,
  })

  if (error) {
    throw error
  }

  return data.map((member) => {
    if (!isFlockMemberRole(member.role)) {
      throw new Error('The flock roster returned an unsupported member role.')
    }

    return {
      displayName: member.display_name,
      location: member.location,
      joinedAt: member.joined_at,
      role: member.role,
      userId: member.user_id,
    }
  })
}
