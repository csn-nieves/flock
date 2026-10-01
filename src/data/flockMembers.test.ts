import { beforeEach, describe, expect, it, vi } from 'vitest'

import { listFlockMembers } from './flockMembers'

const memberQueryMocks = vi.hoisted(() => ({
  rpc: vi.fn(),
}))

vi.mock('./supabase', () => ({
  supabase: {
    rpc: memberQueryMocks.rpc,
  },
}))

describe('flock member data', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns an application-shaped roster from the RLS-protected function', async () => {
    memberQueryMocks.rpc.mockResolvedValue({
      data: [
        {
          display_name: 'Local Organizer',
          location: 'Portland, Oregon',
          joined_at: '2026-01-01T12:00:00.000Z',
          role: 'owner',
          user_id: 'owner-id',
        },
        {
          display_name: 'Local Runner',
          location: null,
          joined_at: '2026-01-02T12:00:00.000Z',
          role: 'member',
          user_id: 'runner-id',
        },
      ],
      error: null,
    })

    await expect(listFlockMembers('morning-runners-id')).resolves.toEqual([
      {
        displayName: 'Local Organizer',
        location: 'Portland, Oregon',
        joinedAt: '2026-01-01T12:00:00.000Z',
        role: 'owner',
        userId: 'owner-id',
      },
      {
        displayName: 'Local Runner',
        location: null,
        joinedAt: '2026-01-02T12:00:00.000Z',
        role: 'member',
        userId: 'runner-id',
      },
    ])
    expect(memberQueryMocks.rpc).toHaveBeenCalledWith('list_flock_members', {
      target_flock_id: 'morning-runners-id',
    })
  })

  it('returns an empty visible roster', async () => {
    memberQueryMocks.rpc.mockResolvedValue({ data: [], error: null })

    await expect(listFlockMembers('hidden-flock-id')).resolves.toEqual([])
  })

  it('rejects with the Supabase query error', async () => {
    const queryError = {
      code: 'PGRST000',
      details: '',
      hint: '',
      message: 'Unable to load members.',
    }
    memberQueryMocks.rpc.mockResolvedValue({ data: null, error: queryError })

    await expect(listFlockMembers('morning-runners-id')).rejects.toBe(
      queryError,
    )
  })

  it('rejects an unsupported role at the data boundary', async () => {
    memberQueryMocks.rpc.mockResolvedValue({
      data: [
        {
          display_name: 'Unexpected Runner',
          location: null,
          joined_at: '2026-01-02T12:00:00.000Z',
          role: 'administrator',
          user_id: 'runner-id',
        },
      ],
      error: null,
    })

    await expect(listFlockMembers('morning-runners-id')).rejects.toThrow(
      'unsupported member role',
    )
  })
})
