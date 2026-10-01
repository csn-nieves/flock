import { useState, type ReactNode } from 'react'

import CreateFlockInvitationPage, {
  FlockInvitationErrorPage,
  FlockInvitationLoadingPage,
  FlockInvitationNotFoundPage,
} from './flocks/CreateFlockInvitationPage'

const flock = {
  id: 'morning-runners-id',
  name: 'Morning Runners',
  owner_id: 'owner-id',
}
const invitation = {
  expiresAt: '2026-10-02T12:00:00.000Z',
  token: 'invitation-token',
  url: 'https://flock.test/invitations/invitation-token',
}
const emailHref =
  'mailto:?subject=Join%20Morning%20Runners%20on%20Flock&body=Join%20Morning%20Runners%20on%20Flock%3A%0A%0Ahttps%3A%2F%2Fflock.test%2Finvitations%2Finvitation-token'

function Canvas({ children }: { children: ReactNode }) {
  return (
    <main className="mx-auto min-h-dvh w-full max-w-app px-4">{children}</main>
  )
}

export function Default() {
  const [createCount, setCreateCount] = useState(0)

  return (
    <Canvas>
      <CreateFlockInvitationPage
        emailHref="mailto:"
        flock={flock}
        isCreating={false}
        onCopy={() => Promise.resolve()}
        onCreate={() => setCreateCount((count) => count + 1)}
      />
      <output className="sr-only" data-testid="create-count">
        {createCount}
      </output>
    </Canvas>
  )
}

export function Creating() {
  return (
    <Canvas>
      <CreateFlockInvitationPage
        emailHref="mailto:"
        flock={flock}
        isCreating
        onCopy={() => Promise.resolve()}
        onCreate={() => undefined}
      />
    </Canvas>
  )
}

export function Error() {
  return (
    <Canvas>
      <CreateFlockInvitationPage
        emailHref="mailto:"
        error="We could not create an invitation. Check your connection and try again."
        flock={flock}
        isCreating={false}
        onCopy={() => Promise.resolve()}
        onCreate={() => undefined}
      />
    </Canvas>
  )
}

export function Ready() {
  const [copiedValue, setCopiedValue] = useState('')
  const [sharedValue, setSharedValue] = useState('')

  return (
    <Canvas>
      <CreateFlockInvitationPage
        emailHref={emailHref}
        flock={flock}
        invitation={invitation}
        isCreating={false}
        onCopy={(value) => {
          setCopiedValue(value)
          return Promise.resolve()
        }}
        onCreate={() => undefined}
        onShare={(value) => {
          setSharedValue(value)
          return Promise.resolve('shared')
        }}
      />
      <output className="sr-only" data-testid="copied-value">
        {copiedValue}
      </output>
      <output className="sr-only" data-testid="shared-value">
        {sharedValue}
      </output>
    </Canvas>
  )
}

export function CopyError() {
  return (
    <Canvas>
      <CreateFlockInvitationPage
        emailHref={emailHref}
        flock={flock}
        invitation={invitation}
        isCreating={false}
        onCopy={() =>
          Promise.reject(new globalThis.Error('Clipboard unavailable.'))
        }
        onCreate={() => undefined}
      />
    </Canvas>
  )
}

export function ShareError() {
  return (
    <Canvas>
      <CreateFlockInvitationPage
        emailHref={emailHref}
        flock={flock}
        invitation={invitation}
        isCreating={false}
        onCopy={() => Promise.resolve()}
        onCreate={() => undefined}
        onShare={() =>
          Promise.reject(new globalThis.Error('Sharing unavailable.'))
        }
      />
    </Canvas>
  )
}

export function ShareCancelled() {
  return (
    <Canvas>
      <CreateFlockInvitationPage
        emailHref={emailHref}
        flock={flock}
        invitation={invitation}
        isCreating={false}
        onCopy={() => Promise.resolve()}
        onCreate={() => undefined}
        onShare={() => Promise.resolve('cancelled')}
      />
    </Canvas>
  )
}

export function Sharing() {
  return (
    <Canvas>
      <CreateFlockInvitationPage
        emailHref={emailHref}
        flock={flock}
        invitation={invitation}
        isCreating={false}
        onCopy={() => Promise.resolve()}
        onCreate={() => undefined}
        onShare={() => new Promise(() => undefined)}
      />
    </Canvas>
  )
}

export function SharingUnavailable() {
  return (
    <Canvas>
      <CreateFlockInvitationPage
        emailHref={emailHref}
        flock={flock}
        invitation={invitation}
        isCreating={false}
        onCopy={() => Promise.resolve()}
        onCreate={() => undefined}
      />
    </Canvas>
  )
}

export function Loading() {
  return (
    <Canvas>
      <FlockInvitationLoadingPage />
    </Canvas>
  )
}

export function NotFound() {
  return (
    <Canvas>
      <FlockInvitationNotFoundPage />
    </Canvas>
  )
}

export function QueryError() {
  const [intent, setIntent] = useState('')

  return (
    <Canvas>
      <FlockInvitationErrorPage
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
      <FlockInvitationErrorPage isRetrying onRetry={() => undefined} />
    </Canvas>
  )
}
