import { useQuery } from '@tanstack/react-query'

import { listFlocks } from '@src/data/flocks'
import { flockQueryKeys } from '@src/data/queryKeys'

export function useFlocks() {
  return useQuery({
    queryFn: listFlocks,
    queryKey: flockQueryKeys.lists(),
  })
}
