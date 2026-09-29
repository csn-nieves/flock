import { QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import { createTestQueryClient } from '@src/test/queryClient'
import type { PropsWithChildren } from 'react'

export function TestQueryClientProvider({ children }: PropsWithChildren) {
  const [queryClient] = useState(createTestQueryClient)

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}
