import type { ThemePreference } from '@src/theme/types'
import type {
  PushNotificationAction,
  PushNotificationStatus,
} from '@src/types/pushNotifications'
import Button from '@src/primitives/Button'

type SettingsPageProps = {
  notificationPendingAction: PushNotificationAction | undefined
  notificationStatus: PushNotificationStatus
  preference: ThemePreference
  onDisableNotifications: () => void
  onEnableNotifications: () => void
  onRetryNotifications: () => void
  onThemeChange: (preference: ThemePreference) => void
}

function getThemeLabel(option: 'system' | 'light' | 'dark') {
  if (option === 'dark') return 'Dark mode'
  if (option === 'light') return 'Light mode'
  return 'Use device setting'
}

function SettingsPage({
  notificationPendingAction,
  notificationStatus,
  onDisableNotifications,
  onEnableNotifications,
  onRetryNotifications,
  onThemeChange,
  preference,
}: SettingsPageProps) {
  return (
    <section
      aria-labelledby="settings-heading"
      className="relative mx-auto w-full max-w-xl py-8 sm:py-12"
    >
      <header className="mt-6">
        <h1
          className="m-0 font-display text-3xl font-bold leading-tight tracking-[-0.025em] text-text"
          id="settings-heading"
        >
          Settings
        </h1>
        <p className="mt-2 mb-0 leading-6 text-text-muted">
          Manage how Flock looks and works for you.
        </p>
      </header>
      <section className="mt-8 rounded-lg border border-border bg-surface-subtle p-5">
        <h2 className="m-0 font-display text-lg font-bold text-text">
          Appearance
        </h2>
        <p className="mt-2 mb-0 leading-6 text-text-muted">
          Choose the palette that feels best for your run planning.
        </p>
        <fieldset className="mt-5 grid gap-2 sm:grid-cols-2">
          <legend className="sr-only">Color theme</legend>
          {(['system', 'light', 'dark'] as const).map((option) => (
            <label
              className="flex min-h-touch cursor-pointer items-center gap-3 rounded-md border border-border bg-background px-3 py-2 text-sm font-bold text-text hover:bg-surface-subtle"
              key={option}
            >
              <input
                checked={preference === option}
                className="size-4 accent-primary"
                name="theme"
                type="radio"
                value={option}
                onChange={() => onThemeChange(option)}
              />
              {getThemeLabel(option)}
            </label>
          ))}
        </fieldset>
      </section>
      <NotificationSettings
        pendingAction={notificationPendingAction}
        status={notificationStatus}
        onDisable={onDisableNotifications}
        onEnable={onEnableNotifications}
        onRetry={onRetryNotifications}
      />
    </section>
  )
}

function NotificationSettings({
  onDisable,
  onEnable,
  onRetry,
  pendingAction,
  status,
}: {
  pendingAction: PushNotificationAction | undefined
  status: PushNotificationStatus
  onDisable: () => void
  onEnable: () => void
  onRetry: () => void
}) {
  const isChecking = status === 'checking'

  return (
    <section
      aria-labelledby="notification-settings-heading"
      className="mt-4 rounded-lg border border-border bg-surface-subtle p-5"
    >
      <h2
        className="m-0 font-display text-lg font-bold text-text"
        id="notification-settings-heading"
      >
        Notifications
      </h2>
      <p className="mt-2 mb-0 leading-6 text-text-muted">
        Get an alert on this device when someone invites you to a personal
        event.
      </p>

      <div className="mt-5 border-l-4 border-primary pl-4">
        <p className="m-0 font-bold text-text" aria-live="polite">
          {getNotificationStatusLabel(status)}
        </p>
        <p className="mt-1 mb-0 text-sm leading-5 text-text-muted">
          {getNotificationStatusDescription(status)}
        </p>
      </div>

      {status === 'off' ? (
        <Button
          className="mt-5"
          isPending={pendingAction === 'enabling'}
          pendingLabel="Turning on notifications"
          onClick={onEnable}
        >
          Turn on notifications
        </Button>
      ) : null}
      {status === 'on' ? (
        <Button
          className="mt-5"
          isPending={pendingAction === 'disabling'}
          pendingLabel="Turning off notifications"
          variant="secondary"
          onClick={onDisable}
        >
          Turn off on this device
        </Button>
      ) : null}
      {status === 'error' ? (
        <Button
          className="mt-5"
          isPending={pendingAction === 'retrying'}
          pendingLabel="Checking notifications"
          variant="secondary"
          onClick={onRetry}
        >
          Try again
        </Button>
      ) : null}
      {isChecking ? (
        <span className="sr-only" role="status">
          Checking notification support
        </span>
      ) : null}
    </section>
  )
}

function getNotificationStatusLabel(status: PushNotificationStatus) {
  if (status === 'on') return 'On for this device'
  if (status === 'off') return 'Off for this device'
  if (status === 'denied') return 'Blocked in browser settings'
  if (status === 'needs-ios-install')
    return 'Add Flock to your Home Screen first'
  if (status === 'unsupported') return 'Not supported on this device'
  if (status === 'not-configured') return 'Not available in this environment'
  if (status === 'error') return 'Could not update notifications'
  return 'Checking this device…'
}

function getNotificationStatusDescription(status: PushNotificationStatus) {
  if (status === 'on') {
    return 'This browser can show new event invitations even when Flock is closed.'
  }
  if (status === 'off') {
    return 'Flock will ask for browser permission after you choose to turn alerts on.'
  }
  if (status === 'denied') {
    return 'Allow notifications for Flock in your browser or device settings, then return here.'
  }
  if (status === 'needs-ios-install') {
    return 'On iPhone and iPad, use Share → Add to Home Screen. Open that installed Flock app, then turn notifications on here.'
  }
  if (status === 'unsupported') {
    return 'You can still find every invitation in the Events screen.'
  }
  if (status === 'not-configured') {
    return 'Push delivery has not been configured for this Flock environment.'
  }
  if (status === 'error') {
    return 'Your current setting was kept. Check your connection and try again.'
  }
  return 'Flock is checking notification permission and this browser’s subscription.'
}

export default SettingsPage
