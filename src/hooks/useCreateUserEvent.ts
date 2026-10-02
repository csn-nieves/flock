import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createUserEvent } from '@src/data/events'
import { eventQueryKeys } from '@src/data/queryKeys'

export function useCreateUserEvent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createUserEvent,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: eventQueryKeys.mine() }),
  })
}
