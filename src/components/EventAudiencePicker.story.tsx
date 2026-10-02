import { useState, type ReactNode } from 'react'

import EventAudiencePicker, {
  type EventAudienceType,
} from './EventAudiencePicker'

function Canvas({ children }: { children: ReactNode }) {
  return <div className="mx-auto w-full max-w-app p-4">{children}</div>
}

export function Interactive() {
  const [audienceType, setAudienceType] = useState<EventAudienceType>('runner')
  const [searchTerm, setSearchTerm] = useState('')
  const [selection, setSelection] = useState('')

  return (
    <Canvas>
      <EventAudiencePicker
        audienceType={audienceType}
        flocks={[
          {
            id: 'harbor-id',
            name: 'Harbor Long Run',
            owner_id: 'owner-id',
          },
        ]}
        isInviting={false}
        isSearching={false}
        runners={[{ display_name: 'Maya Chen', user_id: 'maya-id' }]}
        searchTerm={searchTerm}
        onAudienceTypeChange={(nextAudienceType) => {
          setAudienceType(nextAudienceType)
          setSearchTerm('')
        }}
        onCancel={() => setSelection('cancel')}
        onSearchTermChange={setSearchTerm}
        onSelectFlock={(flockId) => setSelection(`flock:${flockId}`)}
        onSelectRunner={(userId) => setSelection(`runner:${userId}`)}
      />
      <output className="sr-only" data-testid="audience-selection">
        {selection}
      </output>
    </Canvas>
  )
}

export function Creating() {
  return (
    <Canvas>
      <EventAudiencePicker
        audienceType="flock"
        flocks={[
          {
            id: 'harbor-id',
            name: 'Harbor Long Run',
            owner_id: 'owner-id',
          },
        ]}
        isInviting
        isSearching={false}
        runners={[]}
        searchTerm="harbor"
        onAudienceTypeChange={() => undefined}
        onCancel={() => undefined}
        onSearchTermChange={() => undefined}
        onSelectFlock={() => undefined}
        onSelectRunner={() => undefined}
      />
    </Canvas>
  )
}
