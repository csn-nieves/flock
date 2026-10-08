import type { ConversationActivity } from '@src/types/chat'
import {
  formatConversationActivityTime,
  getConversationPreview,
} from '@src/lib/conversationActivity'

export function ConversationSummary({
  activity,
  currentUserId,
  isSelected,
  title,
}: {
  activity: ConversationActivity
  currentUserId: string
  isSelected: boolean
  title: string
}) {
  const hasUnread = activity.unreadCount > 0
  const time = formatConversationActivityTime(activity.latestMessageAt)
  let previewClassName = 'text-text-muted'
  if (hasUnread) previewClassName = 'font-semibold text-text'
  if (isSelected) previewClassName = 'text-on-primary/80'

  return (
    <span aria-hidden="true" className="grid min-w-0 flex-1 gap-0.5 py-1">
      <span className="flex min-w-0 items-baseline gap-2">
        <span
          className={`min-w-0 flex-1 truncate text-sm ${hasUnread ? 'font-bold' : 'font-semibold'}`}
        >
          {title}
        </span>
        {time ? (
          <span
            className={`shrink-0 text-[0.6875rem] ${isSelected ? 'text-on-primary/80' : 'text-text-muted'}`}
          >
            {time}
          </span>
        ) : null}
      </span>
      <span className="flex min-w-0 items-center gap-2">
        <span className={`min-w-0 flex-1 truncate text-xs ${previewClassName}`}>
          {getConversationPreview(activity, currentUserId)}
        </span>
        {hasUnread ? (
          <span
            className={`flex min-w-5 shrink-0 justify-center rounded-full px-1.5 py-0.5 text-[0.6875rem] leading-4 font-bold tabular-nums ${isSelected ? 'bg-background text-primary-strong' : 'bg-primary text-on-primary'}`}
          >
            {activity.unreadCount > 99 ? '99+' : activity.unreadCount}
          </span>
        ) : null}
      </span>
    </span>
  )
}
