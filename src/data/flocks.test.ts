import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createFlock, getFlock, listFlocks, updateFlock } from './flocks'

const flockQueryMocks = vi.hoisted(() => ({
  from: vi.fn(),
  eq: vi.fn(),
  insert: vi.fn(),
  maybeSingle: vi.fn(),
  order: vi.fn(),
  select: vi.fn(),
  single: vi.fn(),
  update: vi.fn(),
}))

vi.mock('./supabase', () => ({
  supabase: {
    from: flockQueryMocks.from,
  },
}))

describe('flock data', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    flockQueryMocks.from.mockReturnValue({
      insert: flockQueryMocks.insert,
      select: flockQueryMocks.select,
      update: flockQueryMocks.update,
    })
    flockQueryMocks.insert.mockReturnValue({
      select: flockQueryMocks.select,
    })
    flockQueryMocks.select.mockReturnValue({
      eq: flockQueryMocks.eq,
      order: flockQueryMocks.order,
      single: flockQueryMocks.single,
    })
    flockQueryMocks.eq.mockReturnValue({
      maybeSingle: flockQueryMocks.maybeSingle,
      select: flockQueryMocks.select,
    })
    flockQueryMocks.update.mockReturnValue({ eq: flockQueryMocks.eq })
  })

  describe('createFlock', () => {
    it('creates and returns a flock owned by the current session', async () => {
      const flock = {
        description: 'Friendly miles for every pace.',
        id: 'sunrise-striders-id',
        location: 'Portland, Oregon',
        name: 'Sunrise Striders',
        owner_id: 'owner-id',
      }
      flockQueryMocks.single.mockResolvedValue({ data: flock, error: null })

      await expect(
        createFlock({
          description: flock.description,
          location: flock.location,
          name: flock.name,
        }),
      ).resolves.toEqual(flock)
      expect(flockQueryMocks.from).toHaveBeenCalledWith('flocks')
      expect(flockQueryMocks.insert).toHaveBeenCalledWith({
        description: 'Friendly miles for every pace.',
        location: 'Portland, Oregon',
        name: 'Sunrise Striders',
      })
      expect(flockQueryMocks.select).toHaveBeenCalledWith(
        'description, id, location, name, owner_id',
      )
      expect(flockQueryMocks.single).toHaveBeenCalledOnce()
    })

    it('rejects with the Supabase mutation error', async () => {
      const mutationError = {
        code: '42501',
        details: '',
        hint: '',
        message: 'Unable to create flock.',
      }
      flockQueryMocks.single.mockResolvedValue({
        data: null,
        error: mutationError,
      })

      await expect(
        createFlock({
          description: 'Friendly miles for every pace.',
          location: 'Portland, Oregon',
          name: 'Sunrise Striders',
        }),
      ).rejects.toBe(mutationError)
    })
  })

  describe('listFlocks', () => {
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
      expect(flockQueryMocks.select).toHaveBeenCalledWith(
        'description, id, location, name, owner_id',
      )
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

  describe('getFlock', () => {
    it('returns one RLS-visible flock summary', async () => {
      const flock = {
        id: 'morning-runners-id',
        name: 'Morning Runners',
        owner_id: 'owner-id',
      }
      flockQueryMocks.maybeSingle.mockResolvedValue({
        data: flock,
        error: null,
      })

      await expect(getFlock('morning-runners-id')).resolves.toEqual(flock)
      expect(flockQueryMocks.from).toHaveBeenCalledWith('flocks')
      expect(flockQueryMocks.select).toHaveBeenCalledWith(
        'description, id, location, name, owner_id',
      )
      expect(flockQueryMocks.eq).toHaveBeenCalledWith(
        'id',
        'morning-runners-id',
      )
      expect(flockQueryMocks.maybeSingle).toHaveBeenCalledOnce()
    })

    it('returns null when the flock is missing or hidden by RLS', async () => {
      flockQueryMocks.maybeSingle.mockResolvedValue({ data: null, error: null })

      await expect(getFlock('hidden-flock-id')).resolves.toBeNull()
    })

    it('rejects with the Supabase query error', async () => {
      const queryError = {
        code: 'PGRST000',
        details: '',
        hint: '',
        message: 'Unable to load flock.',
      }
      flockQueryMocks.maybeSingle.mockResolvedValue({
        data: null,
        error: queryError,
      })

      await expect(getFlock('morning-runners-id')).rejects.toBe(queryError)
    })
  })

  describe('updateFlock', () => {
    it('updates and returns one RLS-authorized flock', async () => {
      const input = {
        description: 'All-pace social miles.',
        flockId: 'morning-runners-id',
        location: 'Eastbank Esplanade',
        name: 'Morning Miles',
      }
      const flock = {
        description: input.description,
        id: input.flockId,
        location: input.location,
        name: input.name,
        owner_id: 'owner-id',
      }
      flockQueryMocks.single.mockResolvedValue({ data: flock, error: null })

      await expect(updateFlock(input)).resolves.toEqual(flock)
      expect(flockQueryMocks.update).toHaveBeenCalledWith({
        description: input.description,
        location: input.location,
        name: input.name,
      })
      expect(flockQueryMocks.eq).toHaveBeenCalledWith('id', input.flockId)
      expect(flockQueryMocks.select).toHaveBeenCalledWith(
        'description, id, location, name, owner_id',
      )
      expect(flockQueryMocks.single).toHaveBeenCalledOnce()
    })
  })
})
