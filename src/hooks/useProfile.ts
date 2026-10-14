import { useQuery } from '@tanstack/react-query'

import { getMyProfile, getRunnerProfile } from '@src/data/profiles'
import { profileQueryKeys } from '@src/data/queryKeys'

export function useProfile() {
  return useQuery({
    queryFn: getMyProfile,
    queryKey: profileQueryKeys.current,
  })
}

export function useRunnerProfile(userId: string) {
  return useQuery({
    enabled: Boolean(userId),
    queryFn: () => getRunnerProfile(userId),
    queryKey: profileQueryKeys.runner(userId),
  })
}
