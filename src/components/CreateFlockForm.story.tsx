import { useState, type ReactNode } from 'react'

import CreateFlockForm from './CreateFlockForm'

function Canvas({ children }: { children: ReactNode }) {
  return <div className="mx-auto w-full max-w-app p-6">{children}</div>
}

export function Default() {
  const [submittedName, setSubmittedName] = useState('')

  return (
    <Canvas>
      <CreateFlockForm onSubmit={setSubmittedName} />
      <output className="sr-only" data-testid="submitted-name">
        {submittedName}
      </output>
    </Canvas>
  )
}

export function ServerError() {
  return (
    <Canvas>
      <CreateFlockForm
        error="We could not create your flock. Check your connection and try again."
        initialName="Sunrise Striders"
        onSubmit={() => undefined}
      />
    </Canvas>
  )
}

export function Submitting() {
  return (
    <Canvas>
      <CreateFlockForm
        initialName="Sunrise Striders"
        isSubmitting
        onSubmit={() => undefined}
      />
    </Canvas>
  )
}
