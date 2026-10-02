import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  ADMIN_EVENTS_PAGE_SIZE,
  cancelAdminEvent,
  listAdminEvents,
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

  it('cancels an event through the authorized event RPC', async () => {
    mocks.rpc.mockResolvedValue({ data: null, error: null })

    await expect(cancelAdminEvent('event-id')).resolves.toBeUndefined()
    expect(mocks.rpc).toHaveBeenCalledWith('cancel_flock_event', {
      target_event_id: 'event-id',
    })
  })
})
