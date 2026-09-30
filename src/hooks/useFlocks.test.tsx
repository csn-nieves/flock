import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { FlockSummary } from '@src/data/flocks'
import { TestQueryClientProvider } from '@src/test/TestQueryClientProvider'
import { useFlocks } from './useFlocks'

const listFlocksMock = vi.hoisted(() => vi.fn())

vi.mock('@src/data/flocks', () => ({
  listFlocks: listFlocksMock,
}))

const flocks: FlockSummary[] = [
  {
    id: 'morning-runners-id',
    name: 'Morning Runners',
    owner_id: 'owner-id',
  },
]

describe('useFlocks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('exposes flock summaries after the query succeeds', async () => {
    listFlocksMock.mockResolvedValue(flocks)

    const { result } = renderHook(() => useFlocks(), {
      wrapper: TestQueryClientProvider,
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual(flocks)
    expect(listFlocksMock).toHaveBeenCalledOnce()
  })

  it('exposes an empty successful result', async () => {
    listFlocksMock.mockResolvedValue([])

    const { result } = renderHook(() => useFlocks(), {
      wrapper: TestQueryClientProvider,
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual([])
  })

  it('exposes a failed query for the page to present safely', async () => {
    const queryError = new Error('Unable to load flocks.')
    listFlocksMock.mockRejectedValue(queryError)

    const { result } = renderHook(() => useFlocks(), {
      wrapper: TestQueryClientProvider,
    })

    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(result.current.error).toBe(queryError)
  })

  it('shares one request between simultaneous consumers', async () => {
    listFlocksMock.mockResolvedValue(flocks)

    const { result } = renderHook(
      () => ({
        first: useFlocks(),
        second: useFlocks(),
      }),
      {
        wrapper: TestQueryClientProvider,
      },
    )

    await waitFor(() => expect(result.current.first.isSuccess).toBe(true))

    expect(result.current.second.data).toEqual(flocks)
    expect(listFlocksMock).toHaveBeenCalledOnce()
  })
})
