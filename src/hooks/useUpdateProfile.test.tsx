import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useQueryClient } from '@tanstack/react-query'
import { updateMyProfile } from '@src/data/profiles'
import { flockQueryKeys, profileQueryKeys } from '@src/data/queryKeys'
import { TestQueryClientProvider } from '@src/test/TestQueryClientProvider'
import { useUpdateProfile } from './useUpdateProfile'

vi.mock('@src/data/profiles', () => ({ updateMyProfile: vi.fn() }))
const updateMock = vi.mocked(updateMyProfile)

describe('useUpdateProfile', () => {
  beforeEach(() => vi.clearAllMocks())
  it('updates the profile cache and invalidates member lists', async () => {
    const profile = {
      displayName: 'New Runner',
      location: 'Portland',
      updatedAt: '2026-10-01',
      userId: 'user',
    }
    updateMock.mockResolvedValue(profile)
    const { result } = renderHook(
      () => ({ mutation: useUpdateProfile(), client: useQueryClient() }),
      { wrapper: TestQueryClientProvider },
    )
    result.current.client.setQueryData(flockQueryKeys.memberLists(), [])
    await act(() =>
      result.current.mutation.mutateAsync({
        displayName: 'New Runner',
        location: 'Portland',
      }),
    )
    await waitFor(() => expect(result.current.mutation.isSuccess).toBe(true))
    expect(
      result.current.client.getQueryData(profileQueryKeys.current),
    ).toEqual(profile)
    expect(
      result.current.client.getQueryState(flockQueryKeys.memberLists())
        ?.isInvalidated,
    ).toBe(true)
  })
})
