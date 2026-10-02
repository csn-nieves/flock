import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  acceptFlockInvitation,
  createFlockEventInvitations,
  createFlockInvitation,
  createTargetedEventInvitation,
  InvitationUnavailableError,
} from './invitations'

const invitationMocks = vi.hoisted(() => ({
  rpc: vi.fn(),
  single: vi.fn(),
}))

vi.mock('./supabase', () => ({
  supabase: {
    rpc: invitationMocks.rpc,
  },
}))

describe('invitation data', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    invitationMocks.rpc.mockReturnValue({ single: invitationMocks.single })
  })

  it('creates an invitation through the membership-checked database function', async () => {
    invitationMocks.single.mockResolvedValue({
      data: {
        expires_at: '2026-10-02T12:00:00.000Z',
        token: 'invitation-token',
      },
      error: null,
    })

    await expect(createFlockInvitation('morning-runners-id')).resolves.toEqual({
      expiresAt: '2026-10-02T12:00:00.000Z',
      token: 'invitation-token',
    })
    expect(invitationMocks.rpc).toHaveBeenCalledWith(
      'create_flock_invitation',
      { target_flock_id: 'morning-runners-id' },
    )
    expect(invitationMocks.single).toHaveBeenCalledOnce()
  })

  it('rejects with the database function error', async () => {
    const mutationError = new Error('Unable to create invitation.')
    invitationMocks.single.mockResolvedValue({
      data: null,
      error: mutationError,
    })

    await expect(createFlockInvitation('morning-runners-id')).rejects.toBe(
      mutationError,
    )
  })

  it('creates a recipient-bound invitation for one runner', async () => {
    invitationMocks.single.mockResolvedValue({
      data: {
        expires_at: '2026-10-03T12:00:00.000Z',
        token: 'runner-token',
      },
      error: null,
    })

    await expect(
      createTargetedEventInvitation('event-id', 'runner-id'),
    ).resolves.toEqual({
      expiresAt: '2026-10-03T12:00:00.000Z',
      token: 'runner-token',
    })
    expect(invitationMocks.rpc).toHaveBeenCalledWith(
      'create_targeted_event_invitation',
      {
        target_event_id: 'event-id',
        target_recipient_user_id: 'runner-id',
      },
    )
  })

  it('creates one recipient-bound invitation per snapshotted flock member', async () => {
    invitationMocks.rpc.mockResolvedValueOnce({
      data: [
        {
          expires_at: '2026-10-03T12:00:00.000Z',
          recipient_display_name: 'Maya Chen',
          recipient_user_id: 'maya-id',
          token: 'maya-token',
        },
        {
          expires_at: '2026-10-03T12:00:00.000Z',
          recipient_display_name: 'Theo Brooks',
          recipient_user_id: 'theo-id',
          token: 'theo-token',
        },
      ],
      error: null,
    })

    await expect(
      createFlockEventInvitations('event-id', 'flock-id'),
    ).resolves.toEqual([
      {
        expiresAt: '2026-10-03T12:00:00.000Z',
        recipientDisplayName: 'Maya Chen',
        recipientUserId: 'maya-id',
        token: 'maya-token',
      },
      {
        expiresAt: '2026-10-03T12:00:00.000Z',
        recipientDisplayName: 'Theo Brooks',
        recipientUserId: 'theo-id',
        token: 'theo-token',
      },
    ])
    expect(invitationMocks.rpc).toHaveBeenCalledWith(
      'create_flock_event_invitations',
      {
        target_event_id: 'event-id',
        target_flock_id: 'flock-id',
      },
    )
  })

  it('accepts an invitation through the atomic database function', async () => {
    invitationMocks.single.mockResolvedValue({
      data: {
        id: 'morning-runners-id',
        name: 'Morning Runners',
        owner_id: 'owner-id',
      },
      error: null,
    })

    await expect(acceptFlockInvitation('invitation-token')).resolves.toEqual({
      id: 'morning-runners-id',
      name: 'Morning Runners',
      owner_id: 'owner-id',
    })
    expect(invitationMocks.rpc).toHaveBeenCalledWith(
      'accept_flock_invitation',
      { invitation_token: 'invitation-token' },
    )
  })

  it('maps invalid, expired, and consumed invitations to one safe error', async () => {
    invitationMocks.single.mockResolvedValue({
      data: null,
      error: {
        code: 'P0002',
        message: 'raw database message',
      },
    })

    await expect(
      acceptFlockInvitation('unavailable-token'),
    ).rejects.toBeInstanceOf(InvitationUnavailableError)
  })

  it('preserves unexpected acceptance failures for route-level recovery', async () => {
    const mutationError = new Error('Connection unavailable.')
    invitationMocks.single.mockResolvedValue({
      data: null,
      error: mutationError,
    })

    await expect(acceptFlockInvitation('invitation-token')).rejects.toBe(
      mutationError,
    )
  })
})
