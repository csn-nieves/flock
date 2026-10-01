import { useQuery } from '@tanstack/react-query'

import { getMyProfile } from '@src/data/profiles'
import { profileQueryKeys } from '@src/data/queryKeys'

export function useProfile() {
  return useQuery({
    queryFn: getMyProfile,
    queryKey: profileQueryKeys.current,
  })
}
