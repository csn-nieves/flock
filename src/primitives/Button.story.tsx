import { useState, type ReactNode } from 'react'
import Button from './Button'

function Canvas({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-touch items-center gap-4 p-6">{children}</div>
  )
}

export function Primary() {
  return (
    <Canvas>
      <Button onClick={() => undefined}>Join a flock</Button>
    </Canvas>
  )
}

export function Secondary() {
  return (
    <Canvas>
      <Button variant="secondary" onClick={() => undefined}>
        View details
      </Button>
    </Canvas>
  )
}

export function Interactive() {
  const [clickCount, setClickCount] = useState(0)

  return (
    <Canvas>
      <Button onClick={() => setClickCount((count) => count + 1)}>
        Create flock
      </Button>
      <form hidden>
        <input data-testid="click-count" readOnly value={String(clickCount)} />
      </form>
    </Canvas>
  )
}

export function Disabled() {
  return (
    <Canvas>
      <Button disabled onClick={() => undefined}>
        Create flock
      </Button>
    </Canvas>
  )
}

export function FocusOrder() {
  return (
    <Canvas>
      <Button onClick={() => undefined}>First action</Button>
      <Button disabled onClick={() => undefined}>
        Unavailable action
      </Button>
      <Button variant="secondary" onClick={() => undefined}>
        Next action
      </Button>
    </Canvas>
  )
}
