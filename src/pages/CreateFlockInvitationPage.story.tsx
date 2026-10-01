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
const onBack = () => undefined
const invitation = {
  expiresAt: '2026-10-02T12:00:00.000Z',
  token: 'invitation-token',
  url: 'https://flock.test/invitations/invitation-token',
}

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
        flock={flock}
        isCreating={false}
        onBack={onBack}
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
        flock={flock}
        isCreating
        onBack={onBack}
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
        error="We could not create an invitation. Check your connection and try again."
        flock={flock}
        isCreating={false}
        onBack={onBack}
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
        flock={flock}
        invitation={invitation}
        isCreating={false}
        onBack={onBack}
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
        flock={flock}
        invitation={invitation}
        isCreating={false}
        onBack={onBack}
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
        flock={flock}
        invitation={invitation}
        isCreating={false}
        onBack={onBack}
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
        flock={flock}
        invitation={invitation}
        isCreating={false}
        onBack={onBack}
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
        flock={flock}
        invitation={invitation}
        isCreating={false}
        onBack={onBack}
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
        flock={flock}
        invitation={invitation}
        isCreating={false}
        onBack={onBack}
        onCopy={() => Promise.resolve()}
        onCreate={() => undefined}
      />
    </Canvas>
  )
}

export function Loading() {
  return (
    <Canvas>
      <FlockInvitationLoadingPage onBack={onBack} />
    </Canvas>
  )
}

export function NotFound() {
  return (
    <Canvas>
      <FlockInvitationNotFoundPage onBack={onBack} />
    </Canvas>
  )
}

export function QueryError() {
  const [intent, setIntent] = useState('')

  return (
    <Canvas>
      <FlockInvitationErrorPage
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
      <FlockInvitationErrorPage
        isRetrying
        onBack={onBack}
        onRetry={() => undefined}
      />
    </Canvas>
  )
}
