import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { cancelAdminEvent } from '@src/data/admin'
import { TestQueryClientProvider } from '@src/test/TestQueryClientProvider'
import { useCancelAdminEvent } from './useCancelAdminEvent'

vi.mock('@src/data/admin', () => ({ cancelAdminEvent: vi.fn() }))

describe('useCancelAdminEvent', () => {
  beforeEach(() => vi.clearAllMocks())

  it('exposes server success for a confirmed cancellation', async () => {
    vi.mocked(cancelAdminEvent).mockResolvedValue(undefined)
    const { result } = renderHook(() => useCancelAdminEvent(), {
      wrapper: TestQueryClientProvider,
    })

    await act(async () => {
      await result.current.mutateAsync('event-id')
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(cancelAdminEvent).toHaveBeenCalled()
    expect(vi.mocked(cancelAdminEvent).mock.calls[0]?.[0]).toBe('event-id')
  })
})
