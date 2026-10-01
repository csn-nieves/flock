import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createFlockInvitation } from './invitations'

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
})
