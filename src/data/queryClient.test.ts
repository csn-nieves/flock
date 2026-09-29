import { describe, expect, it } from 'vitest'
import { createAppQueryClient } from '@src/data/queryClient'

describe('createAppQueryClient', () => {
  it('uses conservative defaults for reads and writes', () => {
    const queryClient = createAppQueryClient()

    expect(queryClient.getDefaultOptions()).toEqual({
      mutations: {
        retry: false,
      },
      queries: {
        retry: 1,
        staleTime: 30_000,
      },
    })
  })

  it('creates an isolated cache for each client', () => {
    const firstClient = createAppQueryClient()
    const secondClient = createAppQueryClient()

    firstClient.setQueryData(['example'], 'first value')

    expect(secondClient.getQueryData(['example'])).toBeUndefined()
  })
})
