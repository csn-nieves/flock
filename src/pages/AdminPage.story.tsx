import { useState } from 'react'

import type { AdminEvent, AdminMembership } from '@src/data/admin'
import AdminPage from './AdminPage'

const initialEvents: AdminEvent[] = [
  {
    canceledAt: null,
    createdBy: 'owner-id',
    flockName: 'Morning Miles',
    id: 'upcoming-event',
    location: 'Riverside Park',
    startsAt: '2099-10-10T12:00:00Z',
    title: 'Saturday social run',
  },
  {
    canceledAt: '2026-10-01T12:00:00Z',
    createdBy: 'maya-id',
    flockName: null,
    id: 'canceled-event',
    location: 'Central Track',
    startsAt: '2099-10-08T22:00:00Z',
    title: 'Evening intervals',
  },
]

const initialMemberships: AdminMembership[] = [
  {
    flockId: 'flock-id',
    flockName: 'Morning Miles',
    joinedAt: '2026-09-12T12:00:00Z',
    role: 'owner',
    userId: 'owner-id',
  },
  {
    flockId: 'flock-id',
    flockName: 'Morning Miles',
    joinedAt: '2026-10-01T12:00:00Z',
    role: 'member',
    userId: 'maya-id',
  },
]

export function EventControls() {
  const [currentPage, setCurrentPage] = useState(1)
  const [currentMembershipPage, setCurrentMembershipPage] = useState(1)
  const [events, setEvents] = useState(initialEvents)
  const [memberships, setMemberships] = useState(initialMemberships)

  return (
    <div className="mx-auto w-full max-w-4xl px-4 sm:px-8">
      <AdminPage
        currentEventPage={currentPage}
        currentMembershipPage={currentMembershipPage}
        events={events}
        flocks={[
          { id: 'flock-id', name: 'Morning Miles', owner_id: 'owner-id' },
        ]}
        isCancelingEvent={false}
        isDeleting={false}
        isRemovingMembership={false}
        memberships={memberships}
        users={[
          { user_id: 'owner-id', display_name: 'Alex Runner' },
          { user_id: 'maya-id', display_name: 'Maya Chen' },
        ]}
        onCancelEvent={async (eventId) => {
          setEvents((currentEvents) =>
            currentEvents.map((event) =>
              event.id === eventId
                ? { ...event, canceledAt: new Date().toISOString() }
                : event,
            ),
          )
        }}
        onDeleteFlock={async () => undefined}
        onDismissCancelEventError={() => undefined}
        onDismissRemoveMembershipError={() => undefined}
        onEventPageChange={setCurrentPage}
        onMembershipPageChange={setCurrentMembershipPage}
        onRemoveMembership={async (membershipToRemove) => {
          setMemberships((currentMemberships) =>
            currentMemberships.filter(
              (membership) =>
                membership.flockId !== membershipToRemove.flockId ||
                membership.userId !== membershipToRemove.userId,
            ),
          )
        }}
        totalEventCount={42}
        totalEventPages={3}
        totalMembershipCount={memberships.length}
        totalMembershipPages={1}
      />
    </div>
  )
}

export function EmptyEvents() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 sm:px-8">
      <AdminPage
        currentEventPage={1}
        currentMembershipPage={1}
        events={[]}
        flocks={[]}
        isCancelingEvent={false}
        isDeleting={false}
        isRemovingMembership={false}
        memberships={[]}
        users={[]}
        onCancelEvent={async () => undefined}
        onDeleteFlock={async () => undefined}
        onDismissCancelEventError={() => undefined}
        onDismissRemoveMembershipError={() => undefined}
        onEventPageChange={() => undefined}
        onMembershipPageChange={() => undefined}
        onRemoveMembership={async () => undefined}
        totalEventCount={0}
        totalEventPages={1}
        totalMembershipCount={0}
        totalMembershipPages={1}
      />
    </div>
  )
}
