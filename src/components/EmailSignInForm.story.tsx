import { useState, type ReactNode } from 'react'

import EmailSignInForm from './EmailSignInForm'

function Canvas({ children }: { children: ReactNode }) {
  return <div className="mx-auto w-full max-w-app p-6">{children}</div>
}

export function Default() {
  const [submittedEmail, setSubmittedEmail] = useState('')

  return (
    <Canvas>
      <EmailSignInForm onSubmit={setSubmittedEmail} />
      <output className="sr-only" data-testid="submitted-email">
        {submittedEmail}
      </output>
    </Canvas>
  )
}

export function ServerError() {
  return (
    <Canvas>
      <EmailSignInForm
        error="We could not send a code. Check your connection and try again."
        initialEmail="runner@example.com"
        onSubmit={() => undefined}
      />
    </Canvas>
  )
}

export function Submitting() {
  return (
    <Canvas>
      <EmailSignInForm
        initialEmail="runner@example.com"
        isSubmitting
        onSubmit={() => undefined}
      />
    </Canvas>
  )
}
