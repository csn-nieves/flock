import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  ADMIN_EVENTS_PAGE_SIZE,
  ADMIN_MEMBERSHIPS_PAGE_SIZE,
  cancelAdminEvent,
  listAdminEvents,
  listAdminMemberships,
  removeAdminMembership,
} from './admin'

const mocks = vi.hoisted(() => ({
  from: vi.fn(),
  rpc: vi.fn(),
}))

vi.mock('./supabase', () => ({ supabase: mocks }))

describe('admin data', () => {
  beforeEach(() => vi.clearAllMocks())

  it('lists one server-paginated page of global events', async () => {
    const query = {
      order: vi.fn(),
      range: vi.fn(),
      select: vi.fn(),
    }
    query.select.mockReturnValue(query)
    query.order.mockReturnValue(query)
    query.range.mockResolvedValue({
      count: 31,
      data: [
        {
          canceled_at: null,
          created_by: 'owner-id',
          flocks: { name: 'Morning Miles' },
          id: 'event-id',
          location: 'Riverside Park',
          starts_at: '2099-10-10T12:00:00Z',
          title: 'Saturday social run',
        },
      ],
      error: null,
    })
    mocks.from.mockReturnValue(query)

    await expect(listAdminEvents(2)).resolves.toEqual({
      events: [
        {
          canceledAt: null,
          createdBy: 'owner-id',
          flockName: 'Morning Miles',
          id: 'event-id',
          location: 'Riverside Park',
          startsAt: '2099-10-10T12:00:00Z',
          title: 'Saturday social run',
        },
      ],
      totalCount: 31,
    })
    expect(query.select).toHaveBeenCalledWith(
      expect.stringContaining('flocks(name)'),
      { count: 'exact' },
    )
    expect(query.order).toHaveBeenCalledWith('starts_at', {
      ascending: false,
    })
    expect(query.range).toHaveBeenCalledWith(
      ADMIN_EVENTS_PAGE_SIZE,
      ADMIN_EVENTS_PAGE_SIZE * 2 - 1,
    )
  })

  it('labels a null flock relationship as a personal event', async () => {
    const query = {
      order: vi.fn(),
      range: vi.fn(),
      select: vi.fn(),
    }
    query.select.mockReturnValue(query)
    query.order.mockReturnValue(query)
    query.range.mockResolvedValue({
      count: 1,
      data: [
        {
          canceled_at: null,
          created_by: 'owner-id',
          flocks: null,
          id: 'event-id',
          location: 'Riverside Park',
          starts_at: '2099-10-10T12:00:00Z',
          title: 'Saturday social run',
        },
      ],
      error: null,
    })
    mocks.from.mockReturnValue(query)

    await expect(listAdminEvents(1)).resolves.toEqual({
      events: [expect.objectContaining({ flockName: null })],
      totalCount: 1,
    })
  })

  it('lists one server-paginated page of global memberships', async () => {
    const query = {
      order: vi.fn(),
      range: vi.fn(),
      select: vi.fn(),
    }
    query.select.mockReturnValue(query)
    query.order.mockReturnValue(query)
    query.range.mockResolvedValue({
      count: 28,
      data: [
        {
          flock_id: 'flock-id',
          flocks: { name: 'Morning Miles' },
          joined_at: '2026-10-01T12:00:00Z',
          role: 'member',
          user_id: 'runner-id',
        },
      ],
      error: null,
    })
    mocks.from.mockReturnValue(query)

    await expect(listAdminMemberships(2)).resolves.toEqual({
      memberships: [
        {
          flockId: 'flock-id',
          flockName: 'Morning Miles',
          joinedAt: '2026-10-01T12:00:00Z',
          role: 'member',
          userId: 'runner-id',
        },
      ],
      totalCount: 28,
    })
    expect(mocks.from).toHaveBeenCalledWith('flock_members')
    expect(query.select).toHaveBeenCalledWith(
      expect.stringContaining('flocks(name)'),
      { count: 'exact' },
    )
    expect(query.order).toHaveBeenCalledWith('joined_at', {
      ascending: false,
    })
    expect(query.range).toHaveBeenCalledWith(
      ADMIN_MEMBERSHIPS_PAGE_SIZE,
      ADMIN_MEMBERSHIPS_PAGE_SIZE * 2 - 1,
    )
  })

  it('rejects an unsupported membership role at the admin data boundary', async () => {
    const query = {
      order: vi.fn(),
      range: vi.fn(),
      select: vi.fn(),
    }
    query.select.mockReturnValue(query)
    query.order.mockReturnValue(query)
    query.range.mockResolvedValue({
      count: 1,
      data: [
        {
          flock_id: 'flock-id',
          flocks: { name: 'Morning Miles' },
          joined_at: '2026-10-01T12:00:00Z',
          role: 'administrator',
          user_id: 'runner-id',
        },
      ],
      error: null,
    })
    mocks.from.mockReturnValue(query)

    await expect(listAdminMemberships(1)).rejects.toThrow(
      'unsupported member role',
    )
  })

  it('cancels an event through the authorized event RPC', async () => {
    mocks.rpc.mockResolvedValue({ data: null, error: null })

    await expect(cancelAdminEvent('event-id')).resolves.toBeUndefined()
    expect(mocks.rpc).toHaveBeenCalledWith('cancel_flock_event', {
      target_event_id: 'event-id',
    })
  })

  it('removes a membership through the superadmin RPC', async () => {
    mocks.rpc.mockResolvedValue({ data: null, error: null })

    await expect(
      removeAdminMembership({ flockId: 'flock-id', userId: 'runner-id' }),
    ).resolves.toBeUndefined()
    expect(mocks.rpc).toHaveBeenCalledWith('remove_flock_member', {
      target_flock_id: 'flock-id',
      target_user_id: 'runner-id',
    })
  })
})
