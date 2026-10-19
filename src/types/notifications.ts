export type NotificationKind =
  | 'event_invitation'
  | 'event_reminder'
  | 'flock_event'
  | 'flock_message'
  | 'direct_message'

export type Notification = {
  body: string
  createdAt: string
  id: string
  isRead: boolean
  kind: NotificationKind
  path: string
  title: string
}
