export type NotificationKind =
  'event_invitation' | 'flock_event' | 'flock_message' | 'direct_message'

export type Notification = {
  body: string
  createdAt: string
  id: string
  isRead: boolean
  kind: NotificationKind
  path: string
  title: string
}
