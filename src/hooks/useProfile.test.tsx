import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getMyProfile } from '@src/data/profiles'
import { TestQueryClientProvider } from '@src/test/TestQueryClientProvider'
import { useProfile } from './useProfile'

vi.mock('@src/data/profiles', () => ({ getMyProfile: vi.fn() }))
const getMock = vi.mocked(getMyProfile)

describe('useProfile', () => {
  beforeEach(() => vi.clearAllMocks())
  it('loads the current profile', async () => {
    const profile = {
      displayName: 'Runner',
      location: null,
      updatedAt: '2026-10-01',
      userId: 'user',
    }
    getMock.mockResolvedValue(profile)
    const { result } = renderHook(() => useProfile(), {
      wrapper: TestQueryClientProvider,
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(profile)
  })
})
