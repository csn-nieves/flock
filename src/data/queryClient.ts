import { QueryClient } from '@tanstack/react-query'

const staleTime = 30_000

export function createAppQueryClient() {
  return new QueryClient({
    defaultOptions: {
      mutations: {
        retry: false,
      },
      queries: {
        retry: 1,
        staleTime,
      },
    },
  })
}
