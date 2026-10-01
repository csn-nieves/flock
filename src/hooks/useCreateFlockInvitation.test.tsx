import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createFlockInvitation } from '@src/data/invitations'
import { TestQueryClientProvider } from '@src/test/TestQueryClientProvider'
import type { FlockInvitation } from '@src/types/invitations'
import { useCreateFlockInvitation } from './useCreateFlockInvitation'

vi.mock('@src/data/invitations', () => ({
  createFlockInvitation: vi.fn(),
}))

const createFlockInvitationMock = vi.mocked(createFlockInvitation)
const invitation: FlockInvitation = {
  expiresAt: '2026-10-02T12:00:00.000Z',
  token: 'invitation-token',
}

describe('useCreateFlockInvitation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('starts idle without creating an invitation', () => {
    const { result } = renderHook(() => useCreateFlockInvitation(), {
      wrapper: TestQueryClientProvider,
    })

    expect(result.current.isIdle).toBe(true)
    expect(createFlockInvitationMock).not.toHaveBeenCalled()
  })

  it('creates an invitation for the supplied flock', async () => {
    createFlockInvitationMock.mockResolvedValue(invitation)
    const { result } = renderHook(() => useCreateFlockInvitation(), {
      wrapper: TestQueryClientProvider,
    })

    await act(() => result.current.mutateAsync('morning-runners-id'))
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(createFlockInvitationMock).toHaveBeenCalledWith(
      'morning-runners-id',
      expect.anything(),
    )
    expect(result.current.data).toEqual(invitation)
  })

  it('exposes invitation creation failures', async () => {
    const mutationError = new Error('Unable to create invitation.')
    createFlockInvitationMock.mockRejectedValue(mutationError)
    const { result } = renderHook(() => useCreateFlockInvitation(), {
      wrapper: TestQueryClientProvider,
    })

    act(() => result.current.mutate('morning-runners-id'))
    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(result.current.error).toBe(mutationError)
  })
})
