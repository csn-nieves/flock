import { useState } from 'react'

import type { PushNotificationStatus } from '@src/types/pushNotifications'
import SettingsPage from './SettingsPage'

export function NotificationControl() {
  const [status, setStatus] = useState<PushNotificationStatus>('off')

  return (
    <div className="mx-auto w-full max-w-app px-4">
      <SettingsPage
        notificationPendingAction={undefined}
        notificationStatus={status}
        preference="system"
        onDisableNotifications={() => setStatus('off')}
        onEnableNotifications={() => setStatus('on')}
        onRetryNotifications={() => setStatus('off')}
        onThemeChange={() => undefined}
      />
    </div>
  )
}

export function IosInstallRequired() {
  return (
    <div className="mx-auto w-full max-w-app px-4">
      <SettingsPage
        notificationPendingAction={undefined}
        notificationStatus="needs-ios-install"
        preference="system"
        onDisableNotifications={() => undefined}
        onEnableNotifications={() => undefined}
        onRetryNotifications={() => undefined}
        onThemeChange={() => undefined}
      />
    </div>
  )
}
