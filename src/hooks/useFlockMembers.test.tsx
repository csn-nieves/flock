import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { FlockMemberSummary } from '@src/types/flockMembers'
import { TestQueryClientProvider } from '@src/test/TestQueryClientProvider'
import { useFlockMembers } from './useFlockMembers'

const listFlockMembersMock = vi.hoisted(() => vi.fn())

vi.mock('@src/data/flockMembers', () => ({
  listFlockMembers: listFlockMembersMock,
}))

const members: FlockMemberSummary[] = [
  {
    displayName: 'Local Organizer',
    location: 'Portland, Oregon',
    joinedAt: '2026-01-01T12:00:00.000Z',
    role: 'owner',
    userId: 'owner-id',
  },
]

describe('useFlockMembers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('exposes the visible flock roster after the query succeeds', async () => {
    listFlockMembersMock.mockResolvedValue(members)

    const { result } = renderHook(() => useFlockMembers('morning-runners-id'), {
      wrapper: TestQueryClientProvider,
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual(members)
    expect(listFlockMembersMock).toHaveBeenCalledWith('morning-runners-id')
  })

  it('does not query without a flock identifier', () => {
    const { result } = renderHook(() => useFlockMembers(undefined), {
      wrapper: TestQueryClientProvider,
    })

    expect(result.current.fetchStatus).toBe('idle')
    expect(listFlockMembersMock).not.toHaveBeenCalled()
  })

  it('exposes a failed roster query for scoped recovery', async () => {
    const queryError = new Error('Unable to load members.')
    listFlockMembersMock.mockRejectedValue(queryError)

    const { result } = renderHook(() => useFlockMembers('morning-runners-id'), {
      wrapper: TestQueryClientProvider,
    })

    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(result.current.error).toBe(queryError)
  })
})
