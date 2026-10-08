import { useState, type ReactNode } from 'react'

import TextArea from './TextArea'

function Canvas({ children }: { children: ReactNode }) {
  return <div className="w-full max-w-app p-6">{children}</div>
}

export function Message() {
  const [message, setMessage] = useState('')

  return (
    <Canvas>
      <TextArea
        className="resize-none"
        hint={`${message.length} / 2,000 characters.`}
        label="Message"
        maxLength={2000}
        placeholder="Message your flock"
        value={message}
        onChange={(event) => setMessage(event.target.value)}
      />
    </Canvas>
  )
}

export function Error() {
  return (
    <Canvas>
      <TextArea
        className="resize-none"
        error="Your message was not sent."
        label="Message"
        value="Meet at the trailhead."
        readOnly
      />
    </Canvas>
  )
}

export function Disabled() {
  return (
    <Canvas>
      <TextArea
        className="resize-none"
        disabled
        label="Message"
        value="Sending this message…"
      />
    </Canvas>
  )
}
