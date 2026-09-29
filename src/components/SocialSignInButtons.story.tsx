import { useState, type ReactNode } from 'react'

import SocialSignInButtons from './SocialSignInButtons'

function Canvas({ children }: { children: ReactNode }) {
  return <div className="mx-auto w-full max-w-app p-6">{children}</div>
}

export function Interactive() {
  const [selectedProvider, setSelectedProvider] = useState('')

  return (
    <Canvas>
      <SocialSignInButtons
        onFacebookSignIn={() => setSelectedProvider('facebook')}
        onGoogleSignIn={() => setSelectedProvider('google')}
      />
      <output className="sr-only" data-testid="selected-provider">
        {selectedProvider}
      </output>
    </Canvas>
  )
}

export function PendingGoogle() {
  return (
    <Canvas>
      <SocialSignInButtons
        pendingProvider="google"
        onFacebookSignIn={() => undefined}
        onGoogleSignIn={() => undefined}
      />
    </Canvas>
  )
}

export function Disabled() {
  return (
    <Canvas>
      <SocialSignInButtons
        disabled
        onFacebookSignIn={() => undefined}
        onGoogleSignIn={() => undefined}
      />
    </Canvas>
  )
}
