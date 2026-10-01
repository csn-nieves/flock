import type { FlockInvitation } from '@src/types/invitations'
import type { FlockSummary } from '@src/types/flocks'

import { supabase } from './supabase'

export class InvitationUnavailableError extends Error {
  constructor() {
    super('Invitation is unavailable.')
    this.name = 'InvitationUnavailableError'
  }
}

export async function acceptFlockInvitation(
  token: string,
): Promise<FlockSummary> {
  const { data, error } = await supabase
    .rpc('accept_flock_invitation', { invitation_token: token })
    .single()

  if (error?.code === 'P0002') {
    throw new InvitationUnavailableError()
  }

  if (error) {
    throw error
  }

  return data
}

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
