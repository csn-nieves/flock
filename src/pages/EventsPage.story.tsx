import { useState } from 'react'

import type { EventAudienceType } from '@src/components/EventAudiencePicker'
import EventsPage from './EventsPage'

const event = {
  attendance: { in: 0, maybe: 0, out: 0, response: null },
  canceledAt: null,
  createdAt: '2026-10-01T12:00:00Z',
  createdBy: 'owner-id',
  description: 'An easy social loop.',
  flockId: null,
  id: 'event-id',
  location: 'Riverside Park',
  startsAt: '2026-10-10T12:00:00Z',
  title: 'Saturday social run',
} as const

export function InvitationAudience() {
  const [audienceType, setAudienceType] = useState<EventAudienceType>('runner')
  const [searchTerm, setSearchTerm] = useState('')

  return (
    <div className="mx-auto w-full max-w-app px-4">
      <EventsPage
        audienceSearchTerm={searchTerm}
        audienceType={audienceType}
        canManageAllEvents={false}
        currentUserId="owner-id"
        events={[event]}
        flockResults={[
          {
            id: 'harbor-id',
            name: 'Harbor Long Run',
            owner_id: 'flock-owner-id',
          },
        ]}
        invitationLink={undefined}
        isCreating={false}
        isInviting={false}
        isLoadingInvitations={false}
        isRefreshing={false}
        isRefreshingInvitations={false}
        isResponding={false}
        isSaving={false}
        isSearchingAudience={false}
        runnerResults={[{ display_name: 'Maya Chen', user_id: 'maya-id' }]}
        onAudienceSearchTermChange={setSearchTerm}
        onAudienceTypeChange={(nextAudienceType) => {
          setAudienceType(nextAudienceType)
          setSearchTerm('')
        }}
        onAcceptInvitation={async () => undefined}
        onCancelEvent={async () => undefined}
        onCloseInvitation={() => undefined}
        onCopyInvitation={async () => undefined}
        onCreate={() => undefined}
        onInviteFlock={async () => undefined}
        onInviteRunner={async () => undefined}
        onRespond={() => undefined}
        onRetryInvitations={() => undefined}
        onUpdate={async () => undefined}
        pendingInvitations={[]}
      />
    </div>
  )
}

export function PendingInvitation() {
  return (
    <div className="mx-auto w-full max-w-app px-4">
      <EventsPage
        audienceSearchTerm=""
        audienceType="runner"
        canManageAllEvents={false}
        currentUserId="runner-id"
        events={[]}
        flockResults={[]}
        invitationLink={undefined}
        isCreating={false}
        isInviting={false}
        isLoadingInvitations={false}
        isRefreshing={false}
        isRefreshingInvitations={false}
        isResponding={false}
        isSaving={false}
        isSearchingAudience={false}
        pendingInvitations={[
          {
            audienceName: 'Harbor Long Run',
            audienceType: 'flock',
            eventDescription: 'Easy miles together before coffee.',
            eventId: 'invited-event-id',
            eventLocation: 'Riverside Park',
            eventStartsAt: '2026-10-10T12:00:00Z',
            eventTitle: 'Cross-flock social run',
            expiresAt: '2026-10-09T12:00:00Z',
            invitationId: 'invitation-id',
          },
        ]}
        runnerResults={[]}
        onAcceptInvitation={async () => undefined}
        onAudienceSearchTermChange={() => undefined}
        onAudienceTypeChange={() => undefined}
        onCancelEvent={async () => undefined}
        onCloseInvitation={() => undefined}
        onCopyInvitation={async () => undefined}
        onCreate={() => undefined}
        onInviteFlock={async () => undefined}
        onInviteRunner={async () => undefined}
        onRespond={() => undefined}
        onRetryInvitations={() => undefined}
        onUpdate={async () => undefined}
      />
    </div>
  )
}
