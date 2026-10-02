import type { FlockInvitation } from '@src/types/invitations'
import type { FlockSummary } from '@src/types/flocks'
import type { FlockEvent } from '@src/types/events'

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

export async function createEventInvitation(
  eventId: string,
): Promise<FlockInvitation> {
  const { data, error } = await supabase
    .rpc('create_event_invitation', { target_event_id: eventId })
    .single()
  if (error) throw error
  return { expiresAt: data.expires_at, token: data.token }
}

export async function createTargetedEventInvitation(
  eventId: string,
  recipientUserId: string,
): Promise<FlockInvitation> {
  const { data, error } = await supabase
    .rpc('create_targeted_event_invitation', {
      target_event_id: eventId,
      target_recipient_user_id: recipientUserId,
    })
    .single()
  if (error) throw error
  return { expiresAt: data.expires_at, token: data.token }
}

export async function acceptEventInvitation(
  token: string,
): Promise<FlockEvent> {
  const { data, error } = await supabase.rpc('accept_event_invitation', {
    invitation_token: token,
  })
  if (error?.code === 'P0002') throw new InvitationUnavailableError()
  if (error) throw error
  return {
    attendance: { in: 0, maybe: 0, out: 0, response: null },
    canceledAt: data.canceled_at,
    createdAt: data.created_at,
    createdBy: data.created_by,
    description: data.description,
    flockId: data.flock_id,
    id: data.id,
    location: data.location,
    startsAt: data.starts_at,
    title: data.title,
  }
}
