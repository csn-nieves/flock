import { useState, type ReactNode } from 'react'
import TextField from './TextField'

function Canvas({ children }: { children: ReactNode }) {
  return <div className="w-full max-w-app p-6">{children}</div>
}

export function Email() {
  const [email, setEmail] = useState('')

  return (
    <Canvas>
      <TextField
        autoComplete="email"
        hint="We will send a six-digit code."
        inputMode="email"
        label="Email address"
        placeholder="runner@example.com"
        type="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
      />
    </Canvas>
  )
}

export function Error() {
  return (
    <Canvas>
      <TextField
        error="Enter a valid email address."
        label="Email address"
        type="email"
        value="runner"
        readOnly
      />
    </Canvas>
  )
}

export function Disabled() {
  return (
    <Canvas>
      <TextField disabled label="Email address" value="runner@example.com" />
    </Canvas>
  )
}
