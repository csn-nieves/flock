import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { FlockSummary } from '@src/types/flocks'
import { TestQueryClientProvider } from '@src/test/TestQueryClientProvider'
import { useFlock } from './useFlock'

const getFlockMock = vi.hoisted(() => vi.fn())

vi.mock('@src/data/flocks', () => ({
  getFlock: getFlockMock,
}))

const flock: FlockSummary = {
  id: 'morning-runners-id',
  name: 'Morning Runners',
  owner_id: 'owner-id',
}

describe('useFlock', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('exposes one visible flock', async () => {
    getFlockMock.mockResolvedValue(flock)

    const { result } = renderHook(() => useFlock(flock.id), {
      wrapper: TestQueryClientProvider,
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual(flock)
    expect(getFlockMock).toHaveBeenCalledWith(flock.id)
  })

  it('exposes a missing or inaccessible flock as a successful null result', async () => {
    getFlockMock.mockResolvedValue(null)

    const { result } = renderHook(() => useFlock('hidden-flock-id'), {
      wrapper: TestQueryClientProvider,
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toBeNull()
  })

  it('exposes a failed detail query for safe route recovery', async () => {
    const queryError = new Error('Unable to load flock.')
    getFlockMock.mockRejectedValue(queryError)

    const { result } = renderHook(() => useFlock(flock.id), {
      wrapper: TestQueryClientProvider,
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error).toBe(queryError)
  })

  it('does not query without a route identifier', () => {
    const { result } = renderHook(() => useFlock(undefined), {
      wrapper: TestQueryClientProvider,
    })

    expect(result.current.fetchStatus).toBe('idle')
    expect(getFlockMock).not.toHaveBeenCalled()
  })
})
