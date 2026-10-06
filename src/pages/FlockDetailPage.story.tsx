import { useState, type ReactNode } from 'react'

import FlockDetailPage, {
  FlockDetailErrorPage,
  FlockDetailLoadingPage,
  FlockDetailNotFoundPage,
} from './flocks/FlockDetailPage'

const flock = {
  description: 'Friendly morning miles for every pace.',
  id: 'morning-runners-id',
  location: 'Eastbank Esplanade, Portland',
  name: 'Morning Runners',
  owner_id: 'owner-id',
}
const onBack = () => undefined

const members = [
  {
    displayName: 'Local Organizer',
    location: 'Portland, Oregon',
    joinedAt: '2026-01-01T12:00:00.000Z',
    role: 'owner' as const,
    userId: 'owner-id',
  },
  {
    displayName: 'Local Runner',
    location: null,
    joinedAt: '2026-01-02T12:00:00.000Z',
    role: 'member' as const,
    userId: 'runner-id',
  },
]

const events = {
  canCreate: true,
  error: undefined,
  events: [
    {
      attendance: { in: 2, maybe: 1, out: 0, response: 'maybe' as const },
      canceledAt: null,
      createdAt: '2026-01-03T12:00:00.000Z',
      createdBy: flock.owner_id,
      description: 'A relaxed loop along the river.',
      flockId: flock.id,
      id: 'river-loop-id',
      location: 'Riverside trailhead',
      startsAt: '2027-01-03T09:00:00.000Z',
      title: 'River loop',
    },
  ],
  isLoading: false,
  isSaving: false,
  isCanceling: false,
  onCancel: async () => undefined,
  onCreate: () => undefined,
  onRespond: () => undefined,
  onRetry: () => undefined,
  onUpdate: async () => undefined,
}

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
        onBack={onBack}
        onInvite={() => undefined}
        onRetryMembers={() => undefined}
        events={events}
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
        onBack={onBack}
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
        onBack={onBack}
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
        onBack={onBack}
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
        onBack={onBack}
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
        onBack={onBack}
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
        onBack={onBack}
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
      <FlockDetailLoadingPage onBack={onBack} />
    </Canvas>
  )
}

export function NotFound() {
  return (
    <Canvas>
      <FlockDetailNotFoundPage onBack={onBack} />
    </Canvas>
  )
}

export function Error() {
  const [intent, setIntent] = useState('')

  return (
    <Canvas>
      <FlockDetailErrorPage
        isRetrying={false}
        onBack={onBack}
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
      <FlockDetailErrorPage
        isRetrying
        onBack={onBack}
        onRetry={() => undefined}
      />
    </Canvas>
  )
}
