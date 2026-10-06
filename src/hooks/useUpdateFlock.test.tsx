import { QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import type { PropsWithChildren } from 'react'
import { flockQueryKeys } from '@src/data/queryKeys'
import { createTestQueryClient } from '@src/test/queryClient'
import type { FlockSummary, UpdateFlockInput } from '@src/types/flocks'
import { useUpdateFlock } from './useUpdateFlock'

const updateFlockMock = vi.hoisted(() => vi.fn())

vi.mock('@src/data/flocks', () => ({
  updateFlock: updateFlockMock,
}))

const input: UpdateFlockInput = {
  description: 'Friendly hill loops with a regroup after every climb.',
  flockId: 'sunrise-striders-id',
  location: 'Mount Tabor, Portland',
  name: 'Sunrise Striders',
}

const flock: FlockSummary = {
  description: input.description,
  id: input.flockId,
  location: input.location,
  name: input.name,
  owner_id: 'owner-id',
}

function renderUpdateFlockHook() {
  const queryClient = createTestQueryClient()

  function Wrapper({ children }: PropsWithChildren) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
  }

  return {
    queryClient,
    ...renderHook(() => useUpdateFlock(input.flockId), { wrapper: Wrapper }),
  }
}

describe('useUpdateFlock', () => {
  it('updates the detail cache and refreshes flock lists', async () => {
    updateFlockMock.mockResolvedValue(flock)
    const { queryClient, result } = renderUpdateFlockHook()
    const invalidateQueries = vi.spyOn(queryClient, 'invalidateQueries')

    await act(() => result.current.mutateAsync(input))
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(updateFlockMock).toHaveBeenCalledWith(input, expect.anything())
    expect(
      queryClient.getQueryData(flockQueryKeys.detail(input.flockId)),
    ).toEqual(flock)
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: flockQueryKeys.lists(),
    })
  })

  it('keeps failures available for the edit form to recover', async () => {
    const mutationError = new Error('Unable to update flock.')
    updateFlockMock.mockRejectedValue(mutationError)
    const { result } = renderUpdateFlockHook()

    act(() => result.current.mutate(input))
    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(result.current.error).toBe(mutationError)
  })
})
