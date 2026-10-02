import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { TestQueryClientProvider } from '@src/test/TestQueryClientProvider'
import { searchRunners } from '@src/data/discovery'
import { useRunnerSearch } from './useDiscoverySearch'

const searchRunnersMock = vi.hoisted(() => vi.fn())
vi.mock('@src/data/discovery', () => ({
  searchRunners: searchRunnersMock,
  searchFlocks: vi.fn(),
}))

describe('useRunnerSearch', () => {
  beforeEach(() => vi.clearAllMocks())

  it('does not query terms shorter than two characters', () => {
    const { result } = renderHook(() => useRunnerSearch('a'), {
      wrapper: TestQueryClientProvider,
    })
    expect(result.current.fetchStatus).toBe('idle')
    expect(searchRunners).not.toHaveBeenCalled()
  })

  it('trims the term and returns results', async () => {
    searchRunnersMock.mockResolvedValue([
      { user_id: 'runner-id', display_name: 'Alex Runner' },
    ])
    const { result } = renderHook(() => useRunnerSearch(' Alex '), {
      wrapper: TestQueryClientProvider,
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(searchRunnersMock).toHaveBeenCalledWith('Alex')
  })
})
