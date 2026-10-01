import type { FlockInvitation } from '@src/types/invitations'

import { supabase } from './supabase'

export async function createFlockInvitation(
  flockId: string,
): Promise<FlockInvitation> {
  const { data, error } = await supabase
    .rpc('create_flock_invitation', { target_flock_id: flockId })
    .single()

  if (error) {
    throw error
  }

  return {
    expiresAt: data.expires_at,
    token: data.token,
  }
}
