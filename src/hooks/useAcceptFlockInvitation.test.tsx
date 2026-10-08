import { useQueryClient } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { acceptFlockInvitation } from '@src/data/invitations'
import { flockChatQueryKeys, flockQueryKeys } from '@src/data/queryKeys'
import { TestQueryClientProvider } from '@src/test/TestQueryClientProvider'
import type { FlockSummary } from '@src/types/flocks'
import { useAcceptFlockInvitation } from './useAcceptFlockInvitation'

vi.mock('@src/data/invitations', () => ({
  acceptFlockInvitation: vi.fn(),
}))

const acceptFlockInvitationMock = vi.mocked(acceptFlockInvitation)
const flock: FlockSummary = {
  id: 'morning-runners-id',
  name: 'Morning Runners',
  owner_id: 'owner-id',
}

describe('useAcceptFlockInvitation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('starts idle without accepting an invitation', () => {
    const { result } = renderHook(() => useAcceptFlockInvitation(), {
      wrapper: TestQueryClientProvider,
    })

    expect(result.current.isIdle).toBe(true)
    expect(acceptFlockInvitationMock).not.toHaveBeenCalled()
  })

  it('accepts the token and refreshes the seeded flock detail', async () => {
    acceptFlockInvitationMock.mockResolvedValue(flock)
    const { result } = renderHook(
      () => ({
        invitation: useAcceptFlockInvitation(),
        queryClient: useQueryClient(),
      }),
      { wrapper: TestQueryClientProvider },
    )
    const invalidateQueries = vi.spyOn(
      result.current.queryClient,
      'invalidateQueries',
    )

    await act(() => result.current.invitation.mutateAsync('invitation-token'))
    await waitFor(() => expect(result.current.invitation.isSuccess).toBe(true))

    expect(acceptFlockInvitationMock).toHaveBeenCalledWith(
      'invitation-token',
      expect.anything(),
    )
    expect(
      result.current.queryClient.getQueryData(flockQueryKeys.detail(flock.id)),
    ).toEqual(flock)
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: flockQueryKeys.detail(flock.id),
    })
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: flockQueryKeys.lists(),
    })
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: flockChatQueryKeys.lists(),
    })
  })

  it('exposes invitation acceptance failures', async () => {
    const mutationError = new Error('Unable to accept invitation.')
    acceptFlockInvitationMock.mockRejectedValue(mutationError)
    const { result } = renderHook(() => useAcceptFlockInvitation(), {
      wrapper: TestQueryClientProvider,
    })

    act(() => result.current.mutate('invitation-token'))
    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(result.current.error).toBe(mutationError)
  })
})
