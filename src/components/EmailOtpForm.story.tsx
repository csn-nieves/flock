import { useState, type ReactNode } from 'react'

import EmailOtpForm from './EmailOtpForm'

const email = 'runner@example.com'

function Canvas({ children }: { children: ReactNode }) {
  return <div className="mx-auto w-full max-w-app p-6">{children}</div>
}

export function Default() {
  const [result, setResult] = useState('')

  return (
    <Canvas>
      <EmailOtpForm
        email={email}
        onChangeEmail={() => setResult('change-email')}
        onSubmit={(code) => setResult(code)}
      />
      <output className="sr-only" data-testid="result">
        {result}
      </output>
    </Canvas>
  )
}

export function ServerError() {
  return (
    <Canvas>
      <EmailOtpForm
        email={email}
        error="That code is invalid or has expired. Check the code and try again."
        initialCode="123456"
        onChangeEmail={() => undefined}
        onSubmit={() => undefined}
      />
    </Canvas>
  )
}

export function Submitting() {
  return (
    <Canvas>
      <EmailOtpForm
        email={email}
        initialCode="123456"
        isSubmitting
        onChangeEmail={() => undefined}
        onSubmit={() => undefined}
      />
    </Canvas>
  )
}
