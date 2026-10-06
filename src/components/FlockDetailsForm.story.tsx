import { useState, type ReactNode } from 'react'

import FlockDetailsForm from './FlockDetailsForm'

const flockDetails = {
  description: 'Friendly miles for every pace.',
  location: 'Portland, Oregon',
  name: 'Sunrise Striders',
}

function Canvas({ children }: { children: ReactNode }) {
  return <div className="mx-auto w-full max-w-app p-6">{children}</div>
}

export function Default() {
  const [submittedName, setSubmittedName] = useState('')

  return (
    <Canvas>
      <FlockDetailsForm
        mode="create"
        onSubmit={(input) => setSubmittedName(input.name)}
      />
      <output className="sr-only" data-testid="submitted-name">
        {submittedName}
      </output>
    </Canvas>
  )
}

export function ServerError() {
  return (
    <Canvas>
      <FlockDetailsForm
        error="We could not save your flock. Check your connection and try again."
        initialValues={flockDetails}
        mode="edit"
        onCancel={() => undefined}
        onSubmit={() => undefined}
      />
    </Canvas>
  )
}

export function Submitting() {
  return (
    <Canvas>
      <FlockDetailsForm
        initialValues={flockDetails}
        isSubmitting
        mode="edit"
        onSubmit={() => undefined}
      />
    </Canvas>
  )
}
