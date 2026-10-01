import { useQuery } from '@tanstack/react-query'

import { listFlockMembers } from '@src/data/flockMembers'
import { flockQueryKeys } from '@src/data/queryKeys'

export function useFlockMembers(flockId: string | undefined) {
  return useQuery({
    enabled: flockId !== undefined,
    queryFn: () => {
      if (flockId === undefined) {
        throw new Error('A flock identifier is required.')
      }

      return listFlockMembers(flockId)
    },
    queryKey: flockQueryKeys.members(flockId ?? ''),
  })
}
