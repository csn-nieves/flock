import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getMyProfile, updateMyProfile } from './profiles'

const mocks = vi.hoisted(() => ({
  auth: { getUser: vi.fn() },
  from: vi.fn(),
  rpc: vi.fn(),
  single: vi.fn(),
}))
vi.mock('./supabase', () => ({ supabase: mocks }))

describe('profile data', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({ single: mocks.single }),
      }),
    })
  })

  it('requires an authenticated user to load a profile', async () => {
    mocks.auth.getUser.mockResolvedValue({ data: { user: null }, error: null })
    await expect(getMyProfile()).rejects.toThrow('authenticated runner')
  })

  it('maps the current profile row', async () => {
    mocks.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-id' } },
      error: null,
    })
    mocks.single.mockResolvedValue({
      data: {
        display_name: 'Runner',
        location: 'Portland',
        updated_at: '2026-10-01',
        user_id: 'user-id',
      },
      error: null,
    })
    await expect(getMyProfile()).resolves.toEqual({
      displayName: 'Runner',
      location: 'Portland',
      updatedAt: '2026-10-01',
      userId: 'user-id',
    })
  })

  it('maps the update RPC result', async () => {
    mocks.rpc.mockResolvedValue({
      data: [
        {
          display_name: 'New Runner',
          location: null,
          updated_at: '2026-10-02',
          user_id: 'user-id',
        },
      ],
      error: null,
    })
    await expect(
      updateMyProfile({ displayName: 'New Runner', location: null }),
    ).resolves.toEqual({
      displayName: 'New Runner',
      location: null,
      updatedAt: '2026-10-02',
      userId: 'user-id',
    })
    expect(mocks.rpc).toHaveBeenCalledWith('update_my_profile', {
      next_display_name: 'New Runner',
      next_location: undefined,
    })
  })
})
