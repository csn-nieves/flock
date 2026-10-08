import { MemoryRouter } from 'react-router'

import { ConversationNavigation } from './AppShell'

const flocks = [
  { id: 'morning-runners-id', name: 'Morning Runners' },
  { id: 'trail-birds-id', name: 'Trail Birds' },
  {
    id: 'sunday-long-run-id',
    name: 'Sunday Long Run Through the Entire River Valley',
  },
]

const directConversations = [
  {
    id: 'maya-chen-conversation-id',
    otherDisplayName: 'Maya Chen',
    otherUserId: 'maya-chen-id',
  },
  {
    id: 'long-name-conversation-id',
    otherDisplayName: 'Alexandria Montgomery-Rivera With a Very Long Name',
    otherUserId: 'long-name-runner-id',
  },
]

export function Populated() {
  return (
    <MemoryRouter initialEntries={['/chats/morning-runners-id']}>
      <aside className="min-h-dvh w-60 bg-surface-subtle p-5">
        <ConversationNavigation
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
