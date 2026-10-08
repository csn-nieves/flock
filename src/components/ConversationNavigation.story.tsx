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

export function Populated() {
  return (
    <MemoryRouter initialEntries={['/chats/morning-runners-id']}>
      <aside className="min-h-dvh w-60 bg-surface-subtle p-5">
        <ConversationNavigation
          flocks={flocks}
          isError={false}
          isPending={false}
          isRefreshing={false}
        />
      </aside>
    </MemoryRouter>
  )
}
