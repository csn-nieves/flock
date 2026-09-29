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
        onResend={() => setResult('resend')}
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
        onResend={() => undefined}
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
        onResend={() => undefined}
        onSubmit={() => undefined}
      />
    </Canvas>
  )
}

export function ResendCooldown() {
  return (
    <Canvas>
      <EmailOtpForm
        email={email}
        resendAvailableInSeconds={42}
        onChangeEmail={() => undefined}
        onResend={() => undefined}
        onSubmit={() => undefined}
      />
    </Canvas>
  )
}

export function ResendError() {
  return (
    <Canvas>
      <EmailOtpForm
        email={email}
        resendError="We could not send another code. Check your connection and try again."
        onChangeEmail={() => undefined}
        onResend={() => undefined}
        onSubmit={() => undefined}
      />
    </Canvas>
  )
}

export function Resending() {
  return (
    <Canvas>
      <EmailOtpForm
        email={email}
        isResending
        onChangeEmail={() => undefined}
        onResend={() => undefined}
        onSubmit={() => undefined}
      />
    </Canvas>
  )
}
