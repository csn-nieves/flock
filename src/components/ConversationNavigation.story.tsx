import { MemoryRouter } from 'react-router'

import { ConversationNavigation } from './AppShell'

const flocks = [
  {
    id: 'morning-runners-id',
    latestMessageAt: '2026-10-08T13:42:00Z',
    latestMessagePreview: 'Meet at the west entrance.',
    latestSenderDisplayName: 'Maya Chen',
    latestSenderId: 'maya-chen-id',
    name: 'Morning Runners',
    unreadCount: 4,
  },
  {
    id: 'trail-birds-id',
    latestMessageAt: '2026-10-07T18:15:00Z',
    latestMessagePreview: 'The trail is clear.',
    latestSenderDisplayName: 'Local Runner',
    latestSenderId: 'runner-id',
    name: 'Trail Birds',
    unreadCount: 0,
  },
  {
    id: 'sunday-long-run-id',
    latestMessageAt: null,
    latestMessagePreview: null,
    latestSenderDisplayName: null,
    latestSenderId: null,
    name: 'Sunday Long Run Through the Entire River Valley',
    unreadCount: 0,
  },
]

const directConversations = [
  {
    id: 'maya-chen-conversation-id',
    latestMessageAt: '2026-10-08T14:12:00Z',
    latestMessagePreview: 'See you in the morning.',
    latestSenderDisplayName: 'Maya Chen',
    latestSenderId: 'maya-chen-id',
    otherDisplayName: 'Maya Chen',
    otherUserId: 'maya-chen-id',
    unreadCount: 1,
  },
  {
    id: 'long-name-conversation-id',
    latestMessageAt: '2026-10-06T12:00:00Z',
    latestMessagePreview: 'That works for me.',
    latestSenderDisplayName: 'Local Runner',
    latestSenderId: 'runner-id',
    otherDisplayName: 'Alexandria Montgomery-Rivera With a Very Long Name',
    otherUserId: 'long-name-runner-id',
    unreadCount: 128,
  },
]

export function Populated() {
  return (
    <MemoryRouter initialEntries={['/chats/morning-runners-id']}>
      <aside className="min-h-dvh w-60 bg-surface-subtle p-5">
        <ConversationNavigation
          currentUserId="runner-id"
          directConversations={directConversations}
          flocks={flocks}
          isDirectError={false}
          isDirectPending={false}
          isDirectRefreshing={false}
          isError={false}
          isPending={false}
          isRefreshing={false}
        />
      </aside>
    </MemoryRouter>
  )
}
