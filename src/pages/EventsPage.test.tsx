import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import EventsPage, { type EventsPageProps } from './EventsPage'

const event = {
  attendance: {
    groups: [],
    in: 0,
    maybe: 0,
    out: 0,
    response: null,
    runOptionId: null,
  },
  canceledAt: null,
  createdAt: '2026-10-01T00:00:00Z',
  createdBy: 'user',
  description: '',
  flockId: null,
  id: 'event',
  location: 'Riverside',
  runOptions: [],
  startsAt: '2026-10-03T12:00:00Z',
  title: 'Saturday run',
}

const defaultProps: EventsPageProps = {
  audienceSearchTerm: '',
  audienceType: 'runner',
  canManageAllEvents: false,
  currentUserId: 'user',
  events: [],
  flockResults: [],
  invitationLink: undefined,
  isCreating: false,
  isInviting: false,
  isLoadingInvitations: false,
  isRefreshing: false,
  isRefreshingInvitations: false,
  isResponding: false,
  isSaving: false,
  isSearchingAudience: false,
  onAudienceSearchTermChange: vi.fn(),
  onAudienceTypeChange: vi.fn(),
  onAcceptInvitation: vi.fn().mockResolvedValue(undefined),
  onCancelEvent: vi.fn().mockResolvedValue(undefined),
  onCloseInvitation: vi.fn(),
  onCopyInvitation: vi.fn(),
  onCreate: vi.fn(),
  onInviteFlock: vi.fn().mockResolvedValue(undefined),
  onInviteRunner: vi.fn().mockResolvedValue(undefined),
  onRespond: vi.fn(),
  onRetryInvitations: vi.fn(),
  onUpdate: vi.fn(),
  pendingInvitations: [],
  runnerResults: [],
}

describe('EventsPage', () => {
  it('shows an empty state and opens the create modal', () => {
    render(
      <EventsPage
        {...defaultProps}
        events={[]}
        isCreating={false}
        isInviting={false}
        isRefreshing={false}
        onCopyInvitation={vi.fn()}
        onCloseInvitation={vi.fn()}
        onCreate={vi.fn()}
        isResponding={false}
        onRespond={vi.fn()}
        isSaving={false}
        onUpdate={vi.fn()}
        onCancelEvent={vi.fn().mockResolvedValue(undefined)}
      />,
    )
    expect(screen.getByText('No personal events yet')).toBeVisible()
    fireEvent.click(screen.getByRole('button', { name: 'Create event' }))
    expect(
      screen.getByRole('dialog', { name: 'Create an event' }),
    ).toBeVisible()
    expect(screen.getByText('Distance')).toBeVisible()
    expect(screen.getByText('Pace')).toBeVisible()
  })

  it('renders personal events', () => {
    render(
      <EventsPage
        {...defaultProps}
        events={[event]}
        isCreating={false}
        isInviting={false}
        isRefreshing={false}
        onCopyInvitation={vi.fn()}
        onCloseInvitation={vi.fn()}
        onCreate={vi.fn()}
        isResponding={false}
        onRespond={vi.fn()}
        isSaving={false}
        onUpdate={vi.fn()}
        onCancelEvent={vi.fn().mockResolvedValue(undefined)}
      />,
    )
    expect(screen.getByRole('heading', { name: 'Saturday run' })).toBeVisible()
    expect(screen.getByText(/Riverside/)).toBeVisible()
    const inviteButton = screen.getByRole('button', { name: 'Invite runners' })
    expect(inviteButton).toHaveClass('bg-primary', 'shrink-0')
    expect(inviteButton.parentElement).toHaveClass('justify-between')
    expect(screen.getByRole('button', { name: "I'm in" })).toHaveClass(
      'bg-background',
    )
    expect(screen.getByRole('button', { name: 'Cancel event' })).toHaveClass(
      'bg-danger',
      'w-full',
    )
  })

  it('keeps creator controls hidden for accepted invitees', () => {
    render(
      <EventsPage {...defaultProps} currentUserId="invitee" events={[event]} />,
    )

    expect(
      screen.queryByRole('button', { name: 'Invite runners' }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Edit event' }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Cancel event' }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Repeat event' }),
    ).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: "I'm in" })).toBeVisible()
  })

  it('keeps event controls available to superadmins', () => {
    render(
      <EventsPage
        {...defaultProps}
        canManageAllEvents
        currentUserId="superadmin"
        events={[event]}
      />,
    )

    expect(screen.getByRole('button', { name: 'Invite runners' })).toBeVisible()
    expect(screen.getByRole('button', { name: 'Edit event' })).toBeVisible()
    expect(screen.getByRole('button', { name: 'Cancel event' })).toBeVisible()
  })

  it('includes run options when editing a personal event', () => {
    render(<EventsPage {...defaultProps} events={[event]} />)

    fireEvent.click(screen.getByRole('button', { name: 'Edit event' }))

    const dialog = screen.getByRole('dialog', { name: 'Edit event' })
    expect(within(dialog).getByText('Distance')).toBeVisible()
    expect(within(dialog).getByText('Pace')).toBeVisible()
  })

  it('repeats a personal event without the original date or run-option identity', async () => {
    const onCreate = vi.fn().mockResolvedValue(undefined)
    const eventWithPlan = {
      ...event,
      description: 'Easy miles together.',
      runOptions: [
        {
          distanceLabel: '5 mi',
          distanceTenths: 50,
          id: 'original-option',
          paceLabel: '8:00/mi',
          paceSeconds: 480,
          position: 0,
          route: {
            coordinates: [
              [-74.01, 40.7],
              [-74, 40.71],
            ] as [number, number][],
            distanceMeters: 8047,
          },
          unit: 'mi' as const,
        },
      ],
    }
    render(
      <EventsPage
        {...defaultProps}
        events={[eventWithPlan]}
        onCreate={onCreate}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Repeat event' }))

    const dialog = screen.getByRole('dialog', { name: 'Repeat event' })
    expect(within(dialog).getByLabelText('Title')).toHaveValue('Saturday run')
    expect(within(dialog).getByLabelText('Location')).toHaveValue('Riverside')
    expect(within(dialog).getByLabelText('Description')).toHaveValue(
      'Easy miles together.',
    )
    expect(within(dialog).getByLabelText('Date and time')).toHaveValue('')
    expect(within(dialog).getByText('Mapped route')).toBeVisible()
    expect(within(dialog).getByText('5.00 mi')).toBeVisible()

    fireEvent.change(within(dialog).getByLabelText('Date and time'), {
      target: { value: '2026-10-17T08:30' },
    })
    fireEvent.click(
      within(dialog).getByRole('button', { name: 'Create event' }),
    )

    await waitFor(() => expect(onCreate).toHaveBeenCalledOnce())
    expect(onCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        runOptions: [
          expect.objectContaining({
            id: undefined,
          }),
        ],
        startsAt: new Date('2026-10-17T08:30').toISOString(),
      }),
    )
    expect(screen.queryByRole('dialog', { name: 'Repeat event' })).toBeNull()
  })

  it('sends an RSVP response for a personal event', () => {
    const onRespond = vi.fn()
    render(
      <EventsPage
        {...defaultProps}
        events={[event]}
        isCreating={false}
        isInviting={false}
        isRefreshing={false}
        isResponding={false}
        onCopyInvitation={vi.fn()}
        onCloseInvitation={vi.fn()}
        onCreate={vi.fn()}
        onRespond={onRespond}
        isSaving={false}
        onUpdate={vi.fn()}
        onCancelEvent={vi.fn().mockResolvedValue(undefined)}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: "I'm in" }))
    expect(onRespond).toHaveBeenCalledWith('event', 'in', null)
  })

  it('requires a run choice for a personal event response', async () => {
    const onRespond = vi.fn().mockResolvedValue(undefined)
    const eventWithOptions = {
      ...event,
      runOptions: [
        {
          distanceLabel: '5 mi',
          distanceTenths: 50,
          id: 'option-5',
          paceLabel: '8:00/mi',
          paceSeconds: 480,
          position: 0,
          unit: 'mi' as const,
        },
      ],
    }
    render(
      <EventsPage
        {...defaultProps}
        events={[eventWithOptions]}
        onRespond={onRespond}
      />,
    )

    expect(screen.getByText('5 mi · 8:00/mi')).toBeVisible()
    fireEvent.click(screen.getByRole('button', { name: "I'm in" }))
    const dialog = screen.getByRole('dialog', { name: 'Choose your run' })
    fireEvent.click(
      within(dialog).getByRole('button', { name: 'Save response' }),
    )

    await waitFor(() => {
      expect(onRespond).toHaveBeenCalledWith('event', 'in', 'option-5')
    })
  })

  it('shows and accepts an in-app flock invitation', async () => {
    const onAcceptInvitation = vi.fn().mockResolvedValue(undefined)
    render(
      <EventsPage
        {...defaultProps}
        onAcceptInvitation={onAcceptInvitation}
        pendingInvitations={[
          {
            audienceName: 'Harbor Long Run',
            audienceType: 'flock',
            eventDescription: 'Easy miles together.',
            eventId: 'invited-event',
            eventLocation: 'Riverside Park',
            eventStartsAt: '2026-10-10T12:00:00Z',
            eventTitle: 'Cross-flock social run',
            expiresAt: '2026-10-09T12:00:00Z',
            invitationId: 'invitation-id',
          },
        ]}
      />,
    )

    expect(
      screen.getByRole('heading', { name: 'Event invitations' }),
    ).toBeVisible()
    expect(screen.getByText('Invited with Harbor Long Run')).toBeVisible()
    fireEvent.click(screen.getByRole('button', { name: 'Accept invitation' }))

    await waitFor(() => {
      expect(onAcceptInvitation).toHaveBeenCalledWith('invitation-id')
    })
  })

  it('shows the invitation link inside a modal and closes it', () => {
    const onCloseInvitation = vi.fn()
    render(
      <EventsPage
        {...defaultProps}
        events={[]}
        invitationLink={{
          audienceName: 'Maya Chen',
          audienceType: 'runner',
          expiresAt: '2026-10-09T12:00:00Z',
          token: 'invite',
          url: 'https://example.test/invite',
        }}
        isCreating={false}
        isInviting={false}
        isRefreshing={false}
        isResponding={false}
        isSaving={false}
        onCloseInvitation={onCloseInvitation}
        onCopyInvitation={vi.fn()}
        onCreate={vi.fn()}
        onRespond={vi.fn()}
        onUpdate={vi.fn()}
        onCancelEvent={vi.fn().mockResolvedValue(undefined)}
      />,
    )
    expect(
      screen.getByRole('dialog', { name: 'Invitation sent' }),
    ).toBeVisible()
    expect(screen.getByText(/only be used by Maya Chen/)).toBeVisible()
    fireEvent.click(screen.getByRole('button', { name: 'Close dialog' }))
    expect(onCloseInvitation).toHaveBeenCalledOnce()
  })

  it('requires confirmation before canceling an event', async () => {
    const onCancelEvent = vi.fn().mockResolvedValue(undefined)
    render(
      <EventsPage
        {...defaultProps}
        events={[event]}
        isCreating={false}
        isInviting={false}
        isRefreshing={false}
        isResponding={false}
        isSaving={false}
        onCloseInvitation={vi.fn()}
        onCopyInvitation={vi.fn()}
        onCreate={vi.fn()}
        onRespond={vi.fn()}
        onUpdate={vi.fn()}
        onCancelEvent={onCancelEvent}
      />,
    )
    fireEvent.click(screen.getAllByRole('button', { name: 'Cancel event' })[0])
    expect(screen.getByRole('dialog', { name: 'Cancel event?' })).toBeVisible()
    expect(onCancelEvent).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Keep event' }))
    expect(
      screen.queryByRole('dialog', { name: 'Cancel event?' }),
    ).not.toBeInTheDocument()
    fireEvent.click(screen.getAllByRole('button', { name: 'Cancel event' })[0])
    const dialog = screen.getByRole('dialog', { name: 'Cancel event?' })
    fireEvent.click(
      within(dialog).getByRole('button', { name: 'Cancel event' }),
    )
    expect(onCancelEvent).toHaveBeenCalledWith('event')
  })

  it('selects a whole flock as a live audience', async () => {
    const onInviteFlock = vi.fn().mockResolvedValue(undefined)
    render(
      <EventsPage
        {...defaultProps}
        audienceSearchTerm="harbor"
        audienceType="flock"
        events={[event]}
        flockResults={[
          { id: 'harbor-id', name: 'Harbor Long Run', owner_id: 'owner-id' },
        ]}
        onInviteFlock={onInviteFlock}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Invite runners' }))
    fireEvent.click(screen.getByRole('button', { name: 'Harbor Long Run' }))

    await waitFor(() => {
      expect(onInviteFlock).toHaveBeenCalledWith(
        'event',
        'harbor-id',
        'Harbor Long Run',
      )
    })
  })
})
