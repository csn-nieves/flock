export type PushNotificationStatus =
  | 'checking'
  | 'denied'
  | 'error'
  | 'needs-ios-install'
  | 'not-configured'
  | 'off'
  | 'on'
  | 'unsupported'

export type PushNotificationAction = 'disabling' | 'enabling' | 'retrying'
