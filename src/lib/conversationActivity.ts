import type { ConversationActivity } from '@src/types/chat'

function isSameLocalDay(left: Date, right: Date) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  )
}

export function formatConversationActivityTime(
  value: string | null,
  now = new Date(),
) {
  if (!value) return ''

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  if (isSameLocalDay(date, now)) {
    return new Intl.DateTimeFormat(undefined, {
      hour: 'numeric',
      minute: '2-digit',
    }).format(date)
  }
  if (date.getFullYear() === now.getFullYear()) {
    return new Intl.DateTimeFormat(undefined, {
      day: 'numeric',
      month: 'short',
    }).format(date)
  }
  return new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    month: 'short',
    year: '2-digit',
  }).format(date)
}

export function getConversationPreview(
  activity: ConversationActivity,
  currentUserId: string,
) {
  if (!activity.latestMessagePreview) return 'No messages yet'

  const normalizedMessage = activity.latestMessagePreview.replace(/\s+/g, ' ')
  const sender =
    activity.latestSenderId === currentUserId
      ? 'You'
      : activity.latestSenderDisplayName
  return sender ? `${sender}: ${normalizedMessage}` : normalizedMessage
}

export function getConversationAccessibleLabel(
  title: string,
  activity: ConversationActivity,
  currentUserId: string,
) {
  let unread = ''
  if (activity.unreadCount > 0) {
    const noun = activity.unreadCount === 1 ? 'message' : 'messages'
    unread = `, ${activity.unreadCount} unread ${noun}`
  }
  const preview = getConversationPreview(activity, currentUserId)
  const timestamp = activity.latestMessageAt
    ? `, ${new Intl.DateTimeFormat(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(new Date(activity.latestMessageAt))}`
    : ''
  return `${title}${unread}, ${preview}${timestamp}`
}
