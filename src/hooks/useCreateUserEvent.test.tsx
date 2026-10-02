import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createUserEvent } from '@src/data/events'
import { TestQueryClientProvider } from '@src/test/TestQueryClientProvider'
import { useCreateUserEvent } from './useCreateUserEvent'

vi.mock('@src/data/events', () => ({ createUserEvent: vi.fn() }))
const createMock = vi.mocked(createUserEvent)

describe('useCreateUserEvent', () => {
  beforeEach(() => vi.clearAllMocks())
  it('creates an event and exposes mutation success', async () => {
    createMock.mockResolvedValue({} as never)
    const { result } = renderHook(() => useCreateUserEvent(), {
      wrapper: TestQueryClientProvider,
    })
    await act(() =>
      result.current.mutateAsync({
        description: '',
        location: 'Riverside',
        startsAt: '2026-10-03T12:00:00Z',
        title: 'Run',
      }),
    )
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(createMock).toHaveBeenCalledWith(
      {
        description: '',
        location: 'Riverside',
        startsAt: '2026-10-03T12:00:00Z',
        title: 'Run',
      },
      expect.anything(),
    )
  })
})
