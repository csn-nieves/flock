import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createUserEvent, listUserEvents } from './events'

const mocks = vi.hoisted(() => ({
  auth: { getSession: vi.fn() },
  from: vi.fn(),
  rpc: vi.fn(),
}))
vi.mock('./supabase', () => ({ supabase: mocks }))

describe('event data', () => {
  beforeEach(() => vi.clearAllMocks())

  it('lists upcoming user-owned events with the null flock filter', async () => {
    const query = {
      select: vi.fn(),
      is: vi.fn(),
      gte: vi.fn(),
      in: vi.fn(),
      order: vi.fn(),
    }
    query.select.mockReturnValue(query)
    query.is.mockReturnValue(query)
    query.gte.mockReturnValue(query)
    query.in.mockReturnValue(query)
    query.order.mockResolvedValue({
      data: [
        {
          canceled_at: null,
          created_at: '2026-10-01',
          created_by: 'user',
          description: '',
          flock_id: null,
          id: 'event',
          location: 'Riverside',
          starts_at: '2026-10-03',
          title: 'Run',
        },
      ],
      error: null,
    })
    const attendanceQuery = { select: vi.fn(), in: vi.fn() }
    attendanceQuery.select.mockReturnValue(attendanceQuery)
    attendanceQuery.in.mockResolvedValue({ data: [], error: null })
    mocks.from.mockReturnValueOnce(query).mockReturnValueOnce(attendanceQuery)
    mocks.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    })
    await expect(listUserEvents()).resolves.toEqual([
      expect.objectContaining({ id: 'event', flockId: null, title: 'Run' }),
    ])
    expect(query.is).toHaveBeenCalledWith('flock_id', null)
  })

  it('creates a user event through the RPC and maps the returned row', async () => {
    mocks.rpc.mockResolvedValue({
      data: {
        canceled_at: null,
        created_at: '2026-10-01',
        created_by: 'user',
        description: '',
        flock_id: null,
        id: 'event',
        location: 'Riverside',
        starts_at: '2026-10-03',
        title: 'Run',
      },
      error: null,
    })
    await expect(
      createUserEvent({
        description: '',
        location: 'Riverside',
        startsAt: '2026-10-03',
        title: 'Run',
      }),
    ).resolves.toEqual(expect.objectContaining({ id: 'event', flockId: null }))
    expect(mocks.rpc).toHaveBeenCalledWith(
      'create_user_event',
      expect.objectContaining({ event_title: 'Run' }),
    )
  })
})
