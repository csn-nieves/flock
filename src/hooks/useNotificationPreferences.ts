import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  getNotificationPreferences,
  updateNotificationPreferences,
} from '@src/data/notificationPreferences'
import { notificationPreferencesQueryKeys } from '@src/data/queryKeys'
import type { NotificationPreferences } from '@src/types/notificationPreferences'

export function useNotificationPreferences() {
  return useQuery({
    queryFn: getNotificationPreferences,
    queryKey: notificationPreferencesQueryKeys.current,
  })
}

export function useUpdateNotificationPreferences() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateNotificationPreferences,
    onSuccess: (preferences: NotificationPreferences) => {
      queryClient.setQueryData(
        notificationPreferencesQueryKeys.current,
        preferences,
      )
    },
  })
}
