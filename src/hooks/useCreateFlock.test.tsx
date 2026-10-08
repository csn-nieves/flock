import { QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { PropsWithChildren } from 'react'
import type { CreateFlockInput, FlockSummary } from '@src/types/flocks'
import { flockChatQueryKeys, flockQueryKeys } from '@src/data/queryKeys'
import { createTestQueryClient } from '@src/test/queryClient'
import { useCreateFlock } from './useCreateFlock'

const createFlockMock = vi.hoisted(() => vi.fn())

vi.mock('@src/data/flocks', () => ({
  createFlock: createFlockMock,
}))

const input: CreateFlockInput = {
  description: 'Friendly miles for every pace.',
  location: 'Portland, Oregon',
  name: 'Sunrise Striders',
}

const flock: FlockSummary = {
  description: input.description,
  id: 'sunrise-striders-id',
  location: input.location,
  name: 'Sunrise Striders',
  owner_id: 'owner-id',
}

function renderCreateFlockHook() {
  const queryClient = createTestQueryClient()

  function Wrapper({ children }: PropsWithChildren) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
  }

  return {
    queryClient,
    ...renderHook(() => useCreateFlock(), { wrapper: Wrapper }),
  }
}

describe('useCreateFlock', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('starts idle without creating a flock', () => {
    const { result } = renderCreateFlockHook()

    expect(result.current.isIdle).toBe(true)
    expect(result.current.isPending).toBe(false)
    expect(createFlockMock).not.toHaveBeenCalled()
  })

  it('creates a flock and invalidates flock lists', async () => {
    createFlockMock.mockResolvedValue(flock)
    const { queryClient, result } = renderCreateFlockHook()
    const invalidateQueries = vi.spyOn(queryClient, 'invalidateQueries')

    await act(() => result.current.mutateAsync(input))
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(createFlockMock).toHaveBeenCalledOnce()
    expect(createFlockMock.mock.calls[0]?.[0]).toEqual(input)
    expect(result.current.data).toEqual(flock)
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: flockQueryKeys.lists(),
    })
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: flockChatQueryKeys.lists(),
    })
  })

  it('exposes pending state while creation is in progress', async () => {
    let resolveCreation: (createdFlock: FlockSummary) => void = () => undefined
    createFlockMock.mockImplementation(
      () =>
        new Promise<FlockSummary>((resolve) => {
          resolveCreation = resolve
        }),
    )
    const { result } = renderCreateFlockHook()

    act(() => result.current.mutate(input))

    await waitFor(() => expect(result.current.isPending).toBe(true))

    act(() => resolveCreation(flock))
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
  })

  it('exposes creation failures for the page to present safely', async () => {
    const mutationError = new Error('Unable to create flock.')
    createFlockMock.mockRejectedValue(mutationError)
    const { result } = renderCreateFlockHook()

    act(() => result.current.mutate(input))

    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(result.current.error).toBe(mutationError)
  })
})
