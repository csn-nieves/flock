import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  cancelFlockEvent,
  setFlockEventResponse,
  updateFlockEvent,
} from '@src/data/events'
import { eventQueryKeys } from '@src/data/queryKeys'
import { TestQueryClientProvider } from '@src/test/TestQueryClientProvider'
import { useCancelFlockEvent } from './useCancelFlockEvent'
import { useSetFlockEventResponse } from './useSetFlockEventResponse'
import { useUpdateFlockEvent } from './useUpdateFlockEvent'

vi.mock('@src/data/events', () => ({
  cancelFlockEvent: vi.fn(),
  setFlockEventResponse: vi.fn(),
  updateFlockEvent: vi.fn(),
}))

describe('event mutation hooks', () => {
  beforeEach(() => vi.clearAllMocks())

  it.each([
    [
      'cancel',
      () => useCancelFlockEvent('flock-id'),
      cancelFlockEvent,
      'event-id',
    ],
    [
      'respond',
      () => useSetFlockEventResponse('flock-id'),
      setFlockEventResponse,
      { eventId: 'event-id', response: 'maybe' },
    ],
    [
      'update',
      () => useUpdateFlockEvent('flock-id'),
      updateFlockEvent,
      {
        eventId: 'event-id',
        input: {
          description: '',
          location: 'Park',
          startsAt: '2026-10-03',
          title: 'Run',
        },
      },
    ],
  ])(
    '%s exposes success and invalidates the flock event query',
    async (_name, hook, mutation, input) => {
      vi.mocked(mutation).mockResolvedValue({} as never)
      const { result } = renderHook(() => hook(), {
        wrapper: TestQueryClientProvider,
      })
      await act(async () => {
        await result.current.mutateAsync(input as never)
      })
      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(vi.mocked(mutation)).toHaveBeenCalled()
      expect(result.current.isError).toBe(false)
      expect(eventQueryKeys.flock('flock-id')).toEqual(['events', 'flock-id'])
    },
  )
})
