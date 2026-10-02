import { useMutation, useQueryClient } from '@tanstack/react-query'
import { deleteAdminFlock } from '@src/data/admin'

export function useDeleteAdminFlock() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteAdminFlock,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['admin', 'flocks'] }),
  })
}
