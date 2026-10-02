import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { removeAdminMembership } from '@src/data/admin'
import { TestQueryClientProvider } from '@src/test/TestQueryClientProvider'
import { useRemoveAdminMembership } from './useRemoveAdminMembership'

vi.mock('@src/data/admin', () => ({ removeAdminMembership: vi.fn() }))

describe('useRemoveAdminMembership', () => {
  beforeEach(() => vi.clearAllMocks())

  it('exposes server success for a confirmed membership removal', async () => {
    vi.mocked(removeAdminMembership).mockResolvedValue(undefined)
    const { result } = renderHook(() => useRemoveAdminMembership(), {
      wrapper: TestQueryClientProvider,
    })

    await act(async () => {
      await result.current.mutateAsync({
        flockId: 'flock-id',
        userId: 'runner-id',
      })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(vi.mocked(removeAdminMembership).mock.calls[0]?.[0]).toEqual({
      flockId: 'flock-id',
      userId: 'runner-id',
    })
  })
})
