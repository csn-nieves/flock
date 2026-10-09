import { useEffect } from 'react'

import NotificationsPage, {
  NotificationsErrorPage,
  NotificationsLoadingPage,
} from '@src/pages/NotificationsPage'
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from '@src/hooks/useNotifications'
import type { Notification } from '@src/types/notifications'

function NotificationsRoute() {
  const notificationsQuery = useNotifications()
  const markReadMutation = useMarkNotificationRead()
  const markAllReadMutation = useMarkAllNotificationsRead()

  useEffect(() => {
    document.title = 'Notifications — Flock'
    return () => {
      document.title = 'Flock'
    }
  }, [])

  if (notificationsQuery.isPending) return <NotificationsLoadingPage />
  if (notificationsQuery.isError || !notificationsQuery.data) {
    return (
      <NotificationsErrorPage
        isRetrying={notificationsQuery.isFetching}
        onRetry={() => void notificationsQuery.refetch()}
      />
    )
  }

  return (
    <NotificationsPage
      isMarkingAllRead={markAllReadMutation.isPending}
      notifications={notificationsQuery.data}
      onMarkAllRead={() => markAllReadMutation.mutate()}
      onMarkRead={(notification: Notification) => {
        if (!notification.isRead) markReadMutation.mutate(notification.id)
      }}
    />
  )
}

export default NotificationsRoute
