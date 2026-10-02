import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { listUserEvents } from '@src/data/events'
import { eventQueryKeys } from '@src/data/queryKeys'
import { TestQueryClientProvider } from '@src/test/TestQueryClientProvider'
import { useUserEvents } from './useUserEvents'

vi.mock('@src/data/events', () => ({ listUserEvents: vi.fn() }))
const listMock = vi.mocked(listUserEvents)

describe('useUserEvents', () => {
  beforeEach(() => vi.clearAllMocks())
  it('loads personal events with the personal event query key', async () => {
    listMock.mockResolvedValue([])
    const { result } = renderHook(() => useUserEvents(), {
      wrapper: TestQueryClientProvider,
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(listMock).toHaveBeenCalledOnce()
    expect(result.current.data).toEqual([])
    expect(result.current.dataUpdatedAt).toBeGreaterThan(0)
    expect(eventQueryKeys.mine()).toEqual(['events', 'mine'])
  })
})
