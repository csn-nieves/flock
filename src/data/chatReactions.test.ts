import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  loadMessageReactions,
  toggleDirectMessageReaction,
  toggleFlockMessageReaction,
} from './chatReactions'

const mocks = vi.hoisted(() => ({
  auth: { getSession: vi.fn() },
  from: vi.fn(),
  rpc: vi.fn(),
}))
vi.mock('./supabase', () => ({ supabase: mocks }))

describe('chat reaction data', () => {
  beforeEach(() => vi.clearAllMocks())

  it('groups counts and marks the current runner selection', async () => {
    const query = { in: vi.fn(), select: vi.fn() }
    query.select.mockReturnValue(query)
    query.in.mockResolvedValue({
      data: [
        {
          created_at: '2026-10-08T12:00:00Z',
          direct_message_id: null,
          flock_message_id: 'message-id',
          id: 'reaction-1',
          reaction_key: 'heart',
          user_id: 'current-user',
        },
        {
          created_at: '2026-10-08T12:01:00Z',
          direct_message_id: null,
          flock_message_id: 'message-id',
          id: 'reaction-2',
          reaction_key: 'heart',
          user_id: 'other-user',
        },
      ],
      error: null,
    })
    mocks.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: 'current-user' } } },
    })
    mocks.from.mockReturnValue(query)

    await expect(
      loadMessageReactions('flock_message_id', ['message-id']),
    ).resolves.toEqual(
      new Map([['message-id', [{ count: 2, isSelected: true, key: 'heart' }]]]),
    )
  })

  it('routes flock and direct toggles through their protected RPCs', async () => {
    mocks.rpc.mockResolvedValue({ data: true, error: null })

    await expect(
      toggleFlockMessageReaction('flock-message', 'fire'),
    ).resolves.toBe(true)
    await expect(
      toggleDirectMessageReaction('direct-message', 'eyes'),
    ).resolves.toBe(true)

    expect(mocks.rpc).toHaveBeenNthCalledWith(
      1,
      'toggle_flock_message_reaction',
      { target_message_id: 'flock-message', target_reaction_key: 'fire' },
    )
    expect(mocks.rpc).toHaveBeenNthCalledWith(
      2,
      'toggle_direct_message_reaction',
      { target_message_id: 'direct-message', target_reaction_key: 'eyes' },
    )
  })
})
