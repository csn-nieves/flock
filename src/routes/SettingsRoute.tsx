import { useEffect } from 'react'

import SettingsPage from '@src/pages/SettingsPage'
import { useTheme } from '@src/theme/useTheme'
import { usePushNotifications } from '@src/hooks/usePushNotifications'

function SettingsRoute() {
  const theme = useTheme()
  const notifications = usePushNotifications()
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
      onThemeChange={theme.setPreference}
      preference={theme.preference}
    />
  )
}

export default SettingsRoute
