import { useEffect } from 'react'

import SettingsPage from '@src/pages/SettingsPage'
import { useTheme } from '@src/theme/useTheme'
import { usePushNotifications } from '@src/hooks/usePushNotifications'
import {
  useNotificationPreferences,
  useUpdateNotificationPreferences,
} from '@src/hooks/useNotificationPreferences'

function SettingsRoute() {
  const theme = useTheme()
  const notifications = usePushNotifications()
  const notificationPreferences = useNotificationPreferences()
  const updateNotificationPreferences = useUpdateNotificationPreferences()
  useEffect(() => {
    document.title = 'Settings — Flock'
    return () => {
      document.title = 'Flock'
    }
  }, [])

  return (
    <SettingsPage
      notificationPendingAction={notifications.pendingAction}
      notificationStatus={notifications.status}
      onDisableNotifications={() => void notifications.disable()}
      onEnableNotifications={() => void notifications.enable()}
      onRetryNotifications={() => void notifications.retry()}
      notificationPreferences={notificationPreferences.data}
      notificationPreferencesError={notificationPreferences.isError}
      notificationPreferencesPending={updateNotificationPreferences.isPending}
      onNotificationPreferencesChange={(preferences) => {
        updateNotificationPreferences.mutate(preferences)
      }}
      onThemeChange={theme.setPreference}
      preference={theme.preference}
    />
  )
}

export default SettingsRoute
