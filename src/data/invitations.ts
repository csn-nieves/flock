import type {
  FlockInvitation,
  PendingEventInvitation,
} from '@src/types/invitations'
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

export async function createFlockEventInvitation(
  eventId: string,
  flockId: string,
): Promise<FlockInvitation> {
  const { data, error } = await supabase
    .rpc('create_flock_event_invitation', {
      target_event_id: eventId,
      target_flock_id: flockId,
    })
    .single()
  if (error) throw error
  return { expiresAt: data.expires_at, token: data.token }
}

export async function listPendingEventInvitations(): Promise<
  PendingEventInvitation[]
> {
  const { data, error } = await supabase.rpc('list_pending_event_invitations')
  if (error) throw error
  return data.map((invitation) => {
    if (
      invitation.invitation_kind !== 'flock' &&
      invitation.invitation_kind !== 'runner'
    ) {
      throw new Error('The invitation returned an unsupported audience type.')
    }

    return {
      audienceName: invitation.audience_name,
      audienceType: invitation.invitation_kind,
      eventDescription: invitation.event_description,
      eventId: invitation.event_id,
      eventLocation: invitation.event_location,
      eventStartsAt: invitation.event_starts_at,
      eventTitle: invitation.event_title,
      expiresAt: invitation.expires_at,
      invitationId: invitation.invitation_id,
    }
  })
}

export async function acceptEventInvitationById(
  invitationId: string,
): Promise<FlockEvent> {
  const { data, error } = await supabase.rpc('accept_event_invitation_by_id', {
    target_invitation_id: invitationId,
  })
  if (error?.code === 'P0002') throw new InvitationUnavailableError()
  if (error) throw error
  return {
    attendance: {
      groups: [],
      in: 0,
      maybe: 0,
      out: 0,
      response: null,
      runOptionId: null,
    },
    canceledAt: data.canceled_at,
    createdAt: data.created_at,
    createdBy: data.created_by,
    description: data.description,
    flockId: data.flock_id,
    id: data.id,
    location: data.location,
    runOptions: [],
    startsAt: data.starts_at,
    title: data.title,
  }
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
    attendance: {
      groups: [],
      in: 0,
      maybe: 0,
      out: 0,
      response: null,
      runOptionId: null,
    },
    canceledAt: data.canceled_at,
    createdAt: data.created_at,
    createdBy: data.created_by,
    description: data.description,
    flockId: data.flock_id,
    id: data.id,
    location: data.location,
    runOptions: [],
    startsAt: data.starts_at,
    title: data.title,
  }
}
