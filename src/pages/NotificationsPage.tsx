import { Link } from 'react-router'

import type { Notification } from '@src/types/notifications'

function formatNotificationDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function getNotificationLabel(notification: Notification) {
  if (notification.kind === 'event_invitation') return 'Event invitation'
  if (notification.kind === 'flock_event') return 'Flock event'
  if (notification.kind === 'flock_message') return 'Flock chat'
  return 'Direct message'
}

export function NotificationsLoadingPage() {
  return (
    <section
      aria-busy="true"
      className="mx-auto w-full max-w-2xl py-8 sm:py-12"
    >
      <div className="h-10 w-48 animate-pulse rounded-md bg-surface-subtle" />
      <div className="mt-8 grid gap-3">
        {[1, 2, 3].map((item) => (
          <div
            className="h-28 animate-pulse rounded-lg bg-surface-subtle"
            key={item}
          />
        ))}
      </div>
    </section>
  )
}

export function NotificationsErrorPage({
  isRetrying,
  onRetry,
}: {
  isRetrying: boolean
  onRetry: () => void
}) {
  return (
    <section className="mx-auto w-full max-w-2xl py-8 sm:py-12">
      <h1 className="m-0 font-display text-3xl font-bold text-text">
        Notifications
      </h1>
      <div className="mt-8 rounded-lg border border-danger/30 bg-danger/5 p-5">
        <p className="m-0 font-bold text-text">
          Notifications are unavailable.
        </p>
        <p className="mt-2 mb-0 text-sm leading-5 text-text-muted">
          Check your connection and try again.
        </p>
        <button
          className="mt-4 min-h-touch rounded-md bg-primary px-4 py-2 text-sm font-bold text-on-primary hover:bg-primary-strong"
          disabled={isRetrying}
          type="button"
          onClick={onRetry}
        >
          {isRetrying ? 'Trying again…' : 'Try again'}
        </button>
      </div>
    </section>
  )
}

export default function NotificationsPage({
  isMarkingAllRead,
  notifications,
  onMarkAllRead,
  onMarkRead,
}: {
  isMarkingAllRead: boolean
  notifications: readonly Notification[]
  onMarkAllRead: () => void
  onMarkRead: (notification: Notification) => void
}) {
  const unreadCount = notifications.filter(
    (notification) => !notification.isRead,
  ).length

  return (
    <section
      aria-labelledby="notifications-heading"
      className="mx-auto w-full max-w-2xl py-8 sm:py-12"
    >
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="m-0 text-sm font-bold uppercase tracking-[0.12em] text-primary-strong">
            Stay in the loop
          </p>
          <h1
            className="mt-2 mb-0 font-display text-3xl font-bold leading-tight tracking-[-0.025em] text-text"
            id="notifications-heading"
          >
            Notifications
          </h1>
          <p className="mt-2 mb-0 leading-6 text-text-muted">
            Invitations, event changes, and conversations that need your
            attention.
          </p>
        </div>
        {unreadCount > 0 ? (
          <button
            className="min-h-touch rounded-md border border-border bg-background px-3 py-2 text-sm font-bold text-text hover:bg-surface-subtle disabled:opacity-60"
            disabled={isMarkingAllRead}
            type="button"
            onClick={onMarkAllRead}
          >
            {isMarkingAllRead ? 'Marking read…' : 'Mark all read'}
          </button>
        ) : null}
      </header>

      {notifications.length === 0 ? (
        <div className="mt-8 rounded-lg border border-dashed border-border bg-surface-subtle p-8 text-center">
          <p className="m-0 font-display text-lg font-bold text-text">
            You’re all caught up
          </p>
          <p className="mt-2 mb-0 text-sm leading-5 text-text-muted">
            New invitations, flock updates, and messages will appear here.
          </p>
        </div>
      ) : (
        <ul className="mt-8 grid list-none gap-3 p-0">
          {notifications.map((notification) => (
            <li key={notification.id}>
              <Link
                className={`block rounded-lg border p-4 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${notification.isRead ? 'border-border bg-background hover:bg-surface-subtle' : 'border-primary/30 bg-primary/5 hover:bg-primary/10'}`}
                to={notification.path}
                onClick={() => onMarkRead(notification)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="m-0 text-xs font-bold uppercase tracking-[0.1em] text-primary-strong">
                      {getNotificationLabel(notification)}
                    </p>
                    <h2 className="mt-1 mb-0 font-display text-lg font-bold text-text">
                      {notification.title}
                    </h2>
                  </div>
                  {!notification.isRead ? (
                    <span
                      className="mt-1 size-2 shrink-0 rounded-full bg-primary"
                      title="Unread"
                    />
                  ) : null}
                </div>
                <p className="mt-2 mb-0 leading-6 text-text-muted">
                  {notification.body}
                </p>
                <time
                  className="mt-3 block text-xs text-text-muted"
                  dateTime={notification.createdAt}
                >
                  {formatNotificationDate(notification.createdAt)}
                </time>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
