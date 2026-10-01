import { useState, type ReactNode } from 'react'

import FlockDetailPage, {
  FlockDetailErrorPage,
  FlockDetailLoadingPage,
  FlockDetailNotFoundPage,
} from './flocks/FlockDetailPage'

const flock = {
  id: 'morning-runners-id',
  name: 'Morning Runners',
  owner_id: 'owner-id',
}

const members = [
  {
    displayName: 'Local Organizer',
    joinedAt: '2026-01-01T12:00:00.000Z',
    role: 'owner' as const,
    userId: 'owner-id',
  },
  {
    displayName: 'Local Runner',
    joinedAt: '2026-01-02T12:00:00.000Z',
    role: 'member' as const,
    userId: 'runner-id',
  },
]

function Canvas({ children }: { children: ReactNode }) {
  return (
    <main className="mx-auto min-h-dvh w-full max-w-app px-4">{children}</main>
  )
}

export function Loaded() {
  return (
    <Canvas>
      <FlockDetailPage
        flock={flock}
        isRefreshing={false}
        memberList={{
          hasRefreshError: false,
          isRefreshing: false,
          isRetrying: false,
          members,
          status: 'ready',
        }}
        onInvite={() => undefined}
        onRetryMembers={() => undefined}
      />
    </Canvas>
  )
}

export function Refreshing() {
  return (
    <Canvas>
      <FlockDetailPage
        flock={flock}
        isRefreshing
        memberList={{
          hasRefreshError: false,
          isRefreshing: false,
          isRetrying: false,
          members,
          status: 'ready',
        }}
        onInvite={() => undefined}
        onRetryMembers={() => undefined}
      />
    </Canvas>
  )
}

export function MembersLoading() {
  return (
    <Canvas>
      <FlockDetailPage
        flock={flock}
        isRefreshing={false}
        memberList={{ status: 'loading' }}
        onInvite={() => undefined}
        onRetryMembers={() => undefined}
      />
    </Canvas>
  )
}

export function MembersEmpty() {
  return (
    <Canvas>
      <FlockDetailPage
        flock={flock}
        isRefreshing={false}
        memberList={{
          hasRefreshError: false,
          isRefreshing: false,
          isRetrying: false,
          members: [],
          status: 'ready',
        }}
        onInvite={() => undefined}
        onRetryMembers={() => undefined}
      />
    </Canvas>
  )
}

export function MembersRefreshing() {
  return (
    <Canvas>
      <FlockDetailPage
        flock={flock}
        isRefreshing={false}
        memberList={{
          hasRefreshError: false,
          isRefreshing: true,
          isRetrying: false,
          members,
          status: 'ready',
        }}
        onInvite={() => undefined}
        onRetryMembers={() => undefined}
      />
    </Canvas>
  )
}

export function MembersError() {
  const [intent, setIntent] = useState('')

  return (
    <Canvas>
      <FlockDetailPage
        flock={flock}
        isRefreshing={false}
        memberList={{ isRetrying: false, status: 'error' }}
        onInvite={() => undefined}
        onRetryMembers={() => setIntent('retry-members')}
      />
      <output className="sr-only" data-testid="page-intent">
        {intent}
      </output>
    </Canvas>
  )
}

export function MembersRefreshError() {
  const [intent, setIntent] = useState('')

  return (
    <Canvas>
      <FlockDetailPage
        flock={flock}
        isRefreshing={false}
        memberList={{
          hasRefreshError: true,
          isRefreshing: false,
          isRetrying: false,
          members,
          status: 'ready',
        }}
        onInvite={() => undefined}
        onRetryMembers={() => setIntent('refresh-members')}
      />
      <output className="sr-only" data-testid="page-intent">
        {intent}
      </output>
    </Canvas>
  )
}

export function Loading() {
  return (
    <Canvas>
      <FlockDetailLoadingPage />
    </Canvas>
  )
}

export function NotFound() {
  return (
    <Canvas>
      <FlockDetailNotFoundPage />
    </Canvas>
  )
}

export function Error() {
  const [intent, setIntent] = useState('')

  return (
    <Canvas>
      <FlockDetailErrorPage
        isRetrying={false}
        onRetry={() => setIntent('retry')}
      />
      <output className="sr-only" data-testid="page-intent">
        {intent}
      </output>
    </Canvas>
  )
}

export function Retrying() {
  return (
    <Canvas>
      <FlockDetailErrorPage isRetrying onRetry={() => undefined} />
    </Canvas>
  )
}
