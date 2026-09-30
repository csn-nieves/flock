import { useMutation, useQueryClient } from '@tanstack/react-query'

import { createFlock } from '@src/data/flocks'
import { flockQueryKeys } from '@src/data/queryKeys'

export function useCreateFlock() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createFlock,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: flockQueryKeys.lists(),
      })
    },
  })
}
