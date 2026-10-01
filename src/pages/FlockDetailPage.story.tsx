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

function Canvas({ children }: { children: ReactNode }) {
  return (
    <main className="mx-auto min-h-dvh w-full max-w-app px-4">{children}</main>
  )
}

export function Loaded() {
  return (
    <Canvas>
      <FlockDetailPage flock={flock} isRefreshing={false} />
    </Canvas>
  )
}

export function Refreshing() {
  return (
    <Canvas>
      <FlockDetailPage flock={flock} isRefreshing />
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
