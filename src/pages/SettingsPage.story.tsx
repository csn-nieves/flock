import { useState } from 'react'

import type { PushNotificationStatus } from '@src/types/pushNotifications'
import type { NotificationPreferences } from '@src/types/notificationPreferences'
import SettingsPage from './SettingsPage'

const notificationPreferences: NotificationPreferences = {
  chatMessages: true,
  eventInvitations: true,
  eventReminders: true,
  flockEvents: true,
}

export function NotificationControl() {
  const [status, setStatus] = useState<PushNotificationStatus>('off')
  const [preferences, setPreferences] = useState(notificationPreferences)

  return (
    <div className="mx-auto w-full max-w-app px-4">
      <SettingsPage
        notificationPendingAction={undefined}
        notificationStatus={status}
        preference="system"
        onDisableNotifications={() => setStatus('off')}
        onEnableNotifications={() => setStatus('on')}
        onRetryNotifications={() => setStatus('off')}
        notificationPreferences={preferences}
        notificationPreferencesError={false}
        notificationPreferencesPending={false}
        onNotificationPreferencesChange={setPreferences}
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
        notificationPreferences={notificationPreferences}
        notificationPreferencesError={false}
        notificationPreferencesPending={false}
        onNotificationPreferencesChange={() => undefined}
        onThemeChange={() => undefined}
      />
    </div>
  )
}
