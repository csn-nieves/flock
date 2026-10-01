import { useState, type ReactNode } from 'react'

import type { FlockSummary } from '@src/types/flocks'
import FlocksPage, {
  FlocksErrorPage,
  FlocksLoadingPage,
} from './flocks/FlocksPage'

type StoryState =
  | { status: 'loading' }
  | { isRetrying: boolean; status: 'error' }
  | {
      flocks: readonly FlockSummary[]
      isRefreshing: boolean
      status: 'success'
    }

const flocks: FlockSummary[] = [
  {
    id: 'morning-runners-id',
    name: 'Morning Runners',
    owner_id: 'owner-id',
  },
  {
    id: 'weekend-miles-id',
    name: 'Weekend Miles',
    owner_id: 'another-owner-id',
  },
]

function Canvas({ children }: { children: ReactNode }) {
  return (
    <main className="mx-auto min-h-dvh w-full max-w-app px-4">{children}</main>
  )
}

function Story({ state }: { state: StoryState }) {
  const [intent, setIntent] = useState('')
  let page: ReactNode

  if (state.status === 'loading') {
    page = <FlocksLoadingPage />
  } else if (state.status === 'error') {
    page = (
      <FlocksErrorPage
        isRetrying={state.isRetrying}
        onRetry={() => setIntent('retry')}
      />
    )
  } else {
    page = (
      <FlocksPage
        flocks={state.flocks}
        isRefreshing={state.isRefreshing}
        onCreate={() => setIntent('create')}
        onProfile={() => setIntent('profile')}
        onSelect={(flockId) => setIntent(`open:${flockId}`)}
      />
    )
  }

  return (
    <Canvas>
      {page}
      <output className="sr-only" data-testid="page-intent">
        {intent}
      </output>
    </Canvas>
  )
}

export function Populated() {
  return <Story state={{ flocks, isRefreshing: false, status: 'success' }} />
}

export function Refreshing() {
  return <Story state={{ flocks, isRefreshing: true, status: 'success' }} />
}

export function Empty() {
  return (
    <Story state={{ flocks: [], isRefreshing: false, status: 'success' }} />
  )
}

export function Loading() {
  return <Story state={{ status: 'loading' }} />
}

export function Error() {
  return <Story state={{ isRetrying: false, status: 'error' }} />
}

export function Retrying() {
  return <Story state={{ isRetrying: true, status: 'error' }} />
}
