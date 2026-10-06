import { useMutation, useQueryClient } from '@tanstack/react-query'

import { updateFlock } from '@src/data/flocks'
import { flockQueryKeys } from '@src/data/queryKeys'

export function useUpdateFlock(flockId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateFlock,
    onSuccess: async (flock) => {
      queryClient.setQueryData(flockQueryKeys.detail(flockId), flock)
      await queryClient.invalidateQueries({
        queryKey: flockQueryKeys.lists(),
      })
    },
  })
}
