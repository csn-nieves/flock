import { useState, type ReactNode } from 'react'

import CreateFlockPage from './flocks/CreateFlockPage'

function Canvas({ children }: { children: ReactNode }) {
  return (
    <main className="mx-auto min-h-dvh w-full max-w-app px-4">{children}</main>
  )
}

function InteractivePage() {
  const [createdName, setCreatedName] = useState('')

  return (
    <Canvas>
      <CreateFlockPage isCreating={false} onCreate={setCreatedName} />
      <output className="sr-only" data-testid="created-name">
        {createdName}
      </output>
    </Canvas>
  )
}

export function Default() {
  return <InteractivePage />
}

export function Error() {
  return (
    <Canvas>
      <CreateFlockPage
        error="We could not create your flock. Check your connection and try again."
        isCreating={false}
        onCreate={() => undefined}
      />
    </Canvas>
  )
}

export function Creating() {
  return (
    <Canvas>
      <CreateFlockPage isCreating onCreate={() => undefined} />
    </Canvas>
  )
}
