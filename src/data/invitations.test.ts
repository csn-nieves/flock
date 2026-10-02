import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  acceptEventInvitationById,
  acceptFlockInvitation,
  createFlockEventInvitation,
  createFlockInvitation,
  createTargetedEventInvitation,
  InvitationUnavailableError,
  listPendingEventInvitations,
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

  it('creates one universal invitation for a live flock audience', async () => {
    invitationMocks.single.mockResolvedValue({
      data: {
        expires_at: '2026-10-09T12:00:00.000Z',
        token: 'flock-token',
      },
      error: null,
    })

    await expect(
      createFlockEventInvitation('event-id', 'flock-id'),
    ).resolves.toEqual({
      expiresAt: '2026-10-09T12:00:00.000Z',
      token: 'flock-token',
    })
    expect(invitationMocks.rpc).toHaveBeenCalledWith(
      'create_flock_event_invitation',
      {
        target_event_id: 'event-id',
        target_flock_id: 'flock-id',
      },
    )
  })

  it('lists pending in-app event invitations', async () => {
    invitationMocks.rpc.mockResolvedValueOnce({
      data: [
        {
          audience_name: 'Harbor Long Run',
          event_description: 'Easy miles together.',
          event_id: 'event-id',
          event_location: 'Riverside Park',
          event_starts_at: '2026-10-10T12:00:00.000Z',
          event_title: 'Saturday social run',
          expires_at: '2026-10-09T12:00:00.000Z',
          invitation_id: 'invitation-id',
          invitation_kind: 'flock',
        },
      ],
      error: null,
    })

    await expect(listPendingEventInvitations()).resolves.toEqual([
      {
        audienceName: 'Harbor Long Run',
        audienceType: 'flock',
        eventDescription: 'Easy miles together.',
        eventId: 'event-id',
        eventLocation: 'Riverside Park',
        eventStartsAt: '2026-10-10T12:00:00.000Z',
        eventTitle: 'Saturday social run',
        expiresAt: '2026-10-09T12:00:00.000Z',
        invitationId: 'invitation-id',
      },
    ])
    expect(invitationMocks.rpc).toHaveBeenCalledWith(
      'list_pending_event_invitations',
    )
  })

  it('accepts an in-app event invitation by identifier', async () => {
    invitationMocks.rpc.mockResolvedValueOnce({
      data: {
        canceled_at: null,
        created_at: '2026-10-01T12:00:00.000Z',
        created_by: 'owner-id',
        description: '',
        flock_id: null,
        id: 'event-id',
        location: 'Riverside Park',
        starts_at: '2026-10-10T12:00:00.000Z',
        title: 'Saturday social run',
      },
      error: null,
    })

    await expect(acceptEventInvitationById('invitation-id')).resolves.toEqual(
      expect.objectContaining({ id: 'event-id', title: 'Saturday social run' }),
    )
    expect(invitationMocks.rpc).toHaveBeenCalledWith(
      'accept_event_invitation_by_id',
      { target_invitation_id: 'invitation-id' },
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
