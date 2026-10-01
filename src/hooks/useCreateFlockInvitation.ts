import { useMutation } from '@tanstack/react-query'

import { createFlockInvitation } from '@src/data/invitations'

export function useCreateFlockInvitation() {
  return useMutation({
    mutationFn: createFlockInvitation,
  })
}
