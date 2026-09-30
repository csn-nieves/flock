import { beforeEach, describe, expect, it, vi } from 'vitest'

import { listFlocks } from './flocks'

const flockQueryMocks = vi.hoisted(() => ({
  from: vi.fn(),
  order: vi.fn(),
  select: vi.fn(),
}))

vi.mock('./supabase', () => ({
  supabase: {
    from: flockQueryMocks.from,
  },
}))

describe('listFlocks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    flockQueryMocks.from.mockReturnValue({
      select: flockQueryMocks.select,
    })
    flockQueryMocks.select.mockReturnValue({
      order: flockQueryMocks.order,
    })
  })

  it('lists the RLS-visible flock summaries in name order', async () => {
    const flocks = [
      {
        id: 'morning-runners-id',
        name: 'Morning Runners',
        owner_id: 'owner-id',
      },
      {
        id: 'weekend-miles-id',
        name: 'Weekend Miles',
        owner_id: 'another-owner-id',
      },
    ]
    flockQueryMocks.order.mockResolvedValue({ data: flocks, error: null })

    await expect(listFlocks()).resolves.toEqual(flocks)
    expect(flockQueryMocks.from).toHaveBeenCalledWith('flocks')
    expect(flockQueryMocks.select).toHaveBeenCalledWith('id, name, owner_id')
    expect(flockQueryMocks.order).toHaveBeenCalledWith('name', {
      ascending: true,
    })
  })

  it('returns an empty list when the current user has no visible flocks', async () => {
    flockQueryMocks.order.mockResolvedValue({ data: [], error: null })

    await expect(listFlocks()).resolves.toEqual([])
  })

  it('rejects with the Supabase query error', async () => {
    const queryError = {
      code: 'PGRST000',
      details: '',
      hint: '',
      message: 'Unable to load flocks.',
    }
    flockQueryMocks.order.mockResolvedValue({
      data: null,
      error: queryError,
    })

    await expect(listFlocks()).rejects.toBe(queryError)
  })
})
