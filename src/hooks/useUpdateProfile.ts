import { useMutation, useQueryClient } from '@tanstack/react-query'

import { updateMyProfile } from '@src/data/profiles'
import { flockQueryKeys, profileQueryKeys } from '@src/data/queryKeys'

export function useUpdateProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateMyProfile,
    onSuccess: (profile) => {
      queryClient.setQueryData(profileQueryKeys.current, profile)
      queryClient.invalidateQueries({ queryKey: flockQueryKeys.memberLists() })
    },
  })
}
