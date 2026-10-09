import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'

import NotificationsPage from './NotificationsPage'

const notifications = [
  {
    body: 'Maya Chen: Meet at the river path.',
    createdAt: '2026-10-09T12:00:00.000Z',
    id: 'notification-1',
    isRead: false,
    kind: 'flock_message' as const,
    path: '/chats/flock-1',
    title: 'New message in Sunrise Striders',
  },
]

describe('NotificationsPage', () => {
  it('renders unread notifications and marks them when opened', () => {
    const onMarkRead = vi.fn()

    render(
      <MemoryRouter>
        <NotificationsPage
          isMarkingAllRead={false}
          notifications={notifications}
          onMarkAllRead={vi.fn()}
          onMarkRead={onMarkRead}
        />
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: 'Notifications' })).toBeVisible()
    expect(screen.getByText('New message in Sunrise Striders')).toBeVisible()
    fireEvent.click(screen.getByRole('link'))
    expect(onMarkRead).toHaveBeenCalledWith(notifications[0])
  })

  it('offers a mark-all action when notifications are unread', () => {
    const onMarkAllRead = vi.fn()

    render(
      <MemoryRouter>
        <NotificationsPage
          isMarkingAllRead={false}
          notifications={notifications}
          onMarkAllRead={onMarkAllRead}
          onMarkRead={vi.fn()}
        />
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Mark all read' }))
    expect(onMarkAllRead).toHaveBeenCalledOnce()
  })
})
