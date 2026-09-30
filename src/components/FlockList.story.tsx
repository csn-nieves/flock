import { useState, type ReactNode } from 'react'

import type { FlockSummary } from '@src/types/flocks'
import FlockList from './FlockList'

const flocks: FlockSummary[] = [
  {
    id: 'morning-runners-id',
    name: 'Morning Runners',
    owner_id: 'owner-id',
  },
  {
    id: 'weekend-miles-id',
    name: 'Weekend Miles',
    owner_id: 'another-owner-id',
  },
]

function Canvas({ children }: { children: ReactNode }) {
  return <div className="mx-auto w-full max-w-app p-4">{children}</div>
}

export function Interactive() {
  const [selectedFlockId, setSelectedFlockId] = useState('')

  return (
    <Canvas>
      <FlockList flocks={flocks} onSelect={setSelectedFlockId} />
      <output className="sr-only" data-testid="selected-flock">
        {selectedFlockId}
      </output>
    </Canvas>
  )
}

export function LongName() {
  return (
    <Canvas>
      <FlockList
        flocks={[
          {
            id: 'long-name-id',
            name: 'Runners Who Meet Before Sunrise Along the Riverside Trail',
            owner_id: 'owner-id',
          },
        ]}
        onSelect={() => undefined}
      />
    </Canvas>
  )
}

export function Empty() {
  return (
    <Canvas>
      <FlockList flocks={[]} onSelect={() => undefined} />
    </Canvas>
  )
}
