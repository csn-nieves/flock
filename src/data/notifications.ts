import type { Notification } from '@src/types/notifications'
import { supabase } from './supabase'

const notificationFields = 'body, created_at, id, kind, path, read_at, title'

export async function listNotifications(): Promise<Notification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select(notificationFields)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(100)
  if (error) throw error

  return data.map((notification) => ({
    body: notification.body,
    createdAt: notification.created_at,
    id: notification.id,
    isRead: notification.read_at !== null,
    kind: notification.kind,
    path: notification.path,
    title: notification.title,
  }))
}

export async function markNotificationRead(notificationId: string) {
  const { error } = await supabase.rpc('mark_notification_read', {
    target_notification_id: notificationId,
  })
  if (error) throw error
}

export async function markAllNotificationsRead() {
  const { error } = await supabase.rpc('mark_all_notifications_read')
  if (error) throw error
}
