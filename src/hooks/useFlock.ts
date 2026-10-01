import { useQuery } from '@tanstack/react-query'

import { getFlock } from '@src/data/flocks'
import { flockQueryKeys } from '@src/data/queryKeys'

export function useFlock(flockId: string | undefined) {
  return useQuery({
    enabled: flockId !== undefined,
    queryFn: () => {
      if (flockId === undefined) {
        throw new Error('A flock identifier is required.')
      }

      return getFlock(flockId)
    },
    queryKey: flockQueryKeys.detail(flockId ?? ''),
  })
}
