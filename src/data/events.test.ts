import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  createFlockEvent,
  createUserEvent,
  listFlockEvents,
  listUserEvents,
  setFlockEventResponse,
} from './events'

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

  it('includes attendance counts and the current user response for personal events', async () => {
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
          created_by: 'owner',
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
    attendanceQuery.in.mockResolvedValue({
      data: [
        { event_id: 'event', user_id: 'current-user', response: 'in' },
        { event_id: 'event', user_id: 'other-user', response: 'maybe' },
      ],
      error: null,
    })
    mocks.from.mockReturnValueOnce(query).mockReturnValueOnce(attendanceQuery)
    mocks.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: 'current-user' } } },
      error: null,
    })

    await expect(listUserEvents()).resolves.toEqual([
      expect.objectContaining({
        attendance: expect.objectContaining({
          in: 1,
          maybe: 1,
          out: 0,
          response: 'in',
        }),
      }),
    ])
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

  it('maps flock run options and grouped attendance', async () => {
    const eventQuery = {
      select: vi.fn(),
      eq: vi.fn(),
      gte: vi.fn(),
      is: vi.fn(),
      order: vi.fn(),
    }
    eventQuery.select.mockReturnValue(eventQuery)
    eventQuery.eq.mockReturnValue(eventQuery)
    eventQuery.gte.mockReturnValue(eventQuery)
    eventQuery.is.mockReturnValue(eventQuery)
    eventQuery.order.mockResolvedValue({
      data: [
        {
          canceled_at: null,
          created_at: '2026-10-01',
          created_by: 'owner',
          description: '',
          flock_id: 'flock',
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
    attendanceQuery.in.mockResolvedValue({
      data: [
        {
          event_id: 'event',
          response: 'in',
          run_option_id: 'option',
          user_id: 'current-user',
        },
        {
          event_id: 'event',
          response: 'maybe',
          run_option_id: 'option',
          user_id: 'other-user',
        },
      ],
      error: null,
    })
    const optionsQuery = { select: vi.fn(), in: vi.fn(), order: vi.fn() }
    optionsQuery.select.mockReturnValue(optionsQuery)
    optionsQuery.in.mockReturnValue(optionsQuery)
    optionsQuery.order.mockResolvedValue({
      data: [
        {
          distance_label: '5 miles',
          event_id: 'event',
          id: 'option',
          pace_label: 'Social',
          position: 0,
        },
      ],
      error: null,
    })
    mocks.from
      .mockReturnValueOnce(eventQuery)
      .mockReturnValueOnce(attendanceQuery)
      .mockReturnValueOnce(optionsQuery)
    mocks.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: 'current-user' } } },
      error: null,
    })

    await expect(listFlockEvents('flock')).resolves.toEqual([
      expect.objectContaining({
        attendance: {
          groups: [{ in: 1, maybe: 1, runOptionId: 'option' }],
          in: 1,
          maybe: 1,
          out: 0,
          response: 'in',
          runOptionId: 'option',
        },
        runOptions: [
          {
            distanceLabel: '5 miles',
            id: 'option',
            paceLabel: 'Social',
            position: 0,
          },
        ],
      }),
    ])
  })

  it('sends run options when creating a flock event and selecting a response', async () => {
    mocks.rpc
      .mockResolvedValueOnce({
        data: [
          {
            created_at: '2026-10-01',
            created_by: 'owner',
            description: '',
            flock_id: 'flock',
            id: 'event',
            location: 'Riverside',
            starts_at: '2026-10-03',
            title: 'Run',
          },
        ],
        error: null,
      })
      .mockResolvedValueOnce({ data: {}, error: null })
    const runOptions = [{ distanceLabel: '5 miles', paceLabel: 'Social' }]

    await createFlockEvent('flock', {
      description: '',
      location: 'Riverside',
      runOptions,
      startsAt: '2026-10-03',
      title: 'Run',
    })
    await setFlockEventResponse('event', 'in', 'option')

    expect(mocks.rpc).toHaveBeenNthCalledWith(
      1,
      'create_flock_event',
      expect.objectContaining({ event_run_options: runOptions }),
    )
    expect(mocks.rpc).toHaveBeenNthCalledWith(2, 'set_flock_event_response', {
      next_response: 'in',
      target_event_id: 'event',
      target_run_option_id: 'option',
    })
  })
})
