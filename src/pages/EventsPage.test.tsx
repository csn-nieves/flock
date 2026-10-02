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
  attendance: { in: 0, maybe: 0, out: 0, response: null },
  canceledAt: null,
  createdAt: '2026-10-01T00:00:00Z',
  createdBy: 'user',
  description: '',
  flockId: null,
  id: 'event',
  location: 'Riverside',
  startsAt: '2026-10-03T12:00:00Z',
  title: 'Saturday run',
}

const defaultProps: EventsPageProps = {
  audienceSearchTerm: '',
  audienceType: 'runner',
  events: [],
  flockResults: [],
  invitationLinks: [],
  isCreating: false,
  isInviting: false,
  isRefreshing: false,
  isResponding: false,
  isSaving: false,
  isSearchingAudience: false,
  onAudienceSearchTermChange: vi.fn(),
  onAudienceTypeChange: vi.fn(),
  onCancelEvent: vi.fn().mockResolvedValue(undefined),
  onCloseInvitation: vi.fn(),
  onCopyInvitation: vi.fn(),
  onCreate: vi.fn(),
  onInviteFlock: vi.fn().mockResolvedValue(undefined),
  onInviteRunner: vi.fn().mockResolvedValue(undefined),
  onRespond: vi.fn(),
  onUpdate: vi.fn(),
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
    expect(onRespond).toHaveBeenCalledWith('event', 'in')
  })

  it('shows the invitation link inside a modal and closes it', () => {
    const onCloseInvitation = vi.fn()
    render(
      <EventsPage
        {...defaultProps}
        events={[]}
        invitationLinks={[
          {
            expiresAt: '2026-10-03T12:00:00Z',
            recipientDisplayName: 'Maya Chen',
            recipientUserId: 'maya-id',
            token: 'invite',
            url: 'https://example.test/invite',
          },
        ]}
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
      screen.getByRole('dialog', { name: 'Invitation ready' }),
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

  it('selects a whole flock as a snapshot audience', async () => {
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
      expect(onInviteFlock).toHaveBeenCalledWith('event', 'harbor-id')
    })
  })
})
