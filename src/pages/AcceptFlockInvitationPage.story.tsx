import { useState, type ReactNode } from 'react'

import {
  FlockInvitationAcceptanceErrorPage,
  FlockInvitationJoiningPage,
  FlockInvitationUnavailablePage,
} from './flocks/AcceptFlockInvitationPage'

function Canvas({ children }: { children: ReactNode }) {
  return (
    <main className="mx-auto min-h-dvh w-full max-w-app px-4">{children}</main>
  )
}

export function Joining() {
  return (
    <Canvas>
      <FlockInvitationJoiningPage />
    </Canvas>
  )
}

export function Unavailable() {
  const [intent, setIntent] = useState('')

  return (
    <Canvas>
      <FlockInvitationUnavailablePage
        onViewFlocks={() => setIntent('view-flocks')}
      />
      <output className="sr-only" data-testid="page-intent">
        {intent}
      </output>
    </Canvas>
  )
}

export function Error() {
  const [intent, setIntent] = useState('')

  return (
    <Canvas>
      <FlockInvitationAcceptanceErrorPage
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
      <FlockInvitationAcceptanceErrorPage
        isRetrying
        onRetry={() => undefined}
      />
    </Canvas>
  )
}
