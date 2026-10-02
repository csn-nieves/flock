import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import type { AdminEvent, AdminMembership } from '@src/data/admin'
import AdminPage from './AdminPage'

const flock = { id: 'flock-id', name: 'Morning Miles', owner_id: 'owner-id' }
const event: AdminEvent = {
  canceledAt: null,
  createdBy: 'owner-id',
  flockName: 'Morning Miles',
  id: 'event-id',
  location: 'Riverside Park',
  startsAt: '2099-10-10T12:00:00Z',
  title: 'Saturday social run',
}
const memberships: AdminMembership[] = [
  {
    flockId: 'flock-id',
    flockName: 'Morning Miles',
    joinedAt: '2026-10-01T12:00:00Z',
    role: 'owner',
    userId: 'owner-id',
  },
  {
    flockId: 'flock-id',
    flockName: 'Morning Miles',
    joinedAt: '2026-10-02T12:00:00Z',
    role: 'member',
    userId: 'user-id',
  },
]
const defaultProps = {
  cancelEventError: undefined,
  currentEventPage: 1,
  currentMembershipPage: 1,
  events: [event],
  flocks: [flock],
  isCancelingEvent: false,
  isDeleting: false,
  isRemovingMembership: false,
  memberships,
  onCancelEvent: vi.fn().mockResolvedValue(undefined),
  onDeleteFlock: vi.fn().mockResolvedValue(undefined),
  onDismissCancelEventError: vi.fn(),
  onDismissRemoveMembershipError: vi.fn(),
  onEventPageChange: vi.fn(),
  onMembershipPageChange: vi.fn(),
  onRemoveMembership: vi.fn().mockResolvedValue(undefined),
  removeMembershipError: undefined,
  totalEventCount: 1,
  totalEventPages: 1,
  totalMembershipCount: 2,
  totalMembershipPages: 1,
  users: [
    { user_id: 'owner-id', display_name: 'Alex Runner' },
    { user_id: 'user-id', display_name: 'Maya Chen' },
  ],
}

describe('AdminPage', () => {
  it('shows global events with audience, creator, and status', () => {
    render(<AdminPage {...defaultProps} />)

    expect(screen.getByRole('heading', { name: 'Events (1)' })).toBeVisible()
    expect(
      screen.getByRole('heading', { name: 'Saturday social run' }),
    ).toBeVisible()
    expect(screen.getByText('Upcoming')).toBeVisible()
    expect(screen.getByText(/Riverside Park/)).toBeVisible()
    expect(
      screen.getByText('Flock event · Morning Miles · Created by Alex Runner'),
    ).toBeVisible()
    expect(screen.getByText('Owner: Alex Runner')).toBeVisible()
  })

  it('confirms an event cancellation and waits for server success', async () => {
    const onCancelEvent = vi.fn().mockResolvedValue(undefined)
    render(<AdminPage {...defaultProps} onCancelEvent={onCancelEvent} />)

    fireEvent.click(screen.getByRole('button', { name: 'Cancel event' }))
    const dialog = screen.getByRole('dialog', { name: 'Cancel event?' })
    expect(dialog).toBeVisible()
    expect(onCancelEvent).not.toHaveBeenCalled()

    fireEvent.click(
      within(dialog).getByRole('button', { name: 'Cancel event' }),
    )
    await waitFor(() => expect(onCancelEvent).toHaveBeenCalledWith('event-id'))
    await waitFor(() =>
      expect(
        screen.queryByRole('dialog', { name: 'Cancel event?' }),
      ).not.toBeInTheDocument(),
    )
  })

  it('keeps cancellation recovery in the open dialog', async () => {
    const onCancelEvent = vi.fn().mockRejectedValue(new Error('offline'))
    const { rerender } = render(
      <AdminPage {...defaultProps} onCancelEvent={onCancelEvent} />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Cancel event' }))
    const dialog = screen.getByRole('dialog', { name: 'Cancel event?' })
    fireEvent.click(
      within(dialog).getByRole('button', { name: 'Cancel event' }),
    )
    await waitFor(() => expect(onCancelEvent).toHaveBeenCalledOnce())

    rerender(
      <AdminPage
        {...defaultProps}
        cancelEventError="We could not cancel this event. Check your connection and try again."
        onCancelEvent={onCancelEvent}
      />,
    )
    expect(screen.getByRole('dialog', { name: 'Cancel event?' })).toBeVisible()
    expect(screen.getByRole('alert')).toHaveTextContent(
      'We could not cancel this event.',
    )
  })

  it('uses URL-owned pagination callbacks and disables boundaries', () => {
    const onEventPageChange = vi.fn()
    render(
      <AdminPage
        {...defaultProps}
        onEventPageChange={onEventPageChange}
        totalEventCount={45}
        totalEventPages={3}
      />,
    )

    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    expect(onEventPageChange).toHaveBeenCalledWith(2)
  })

  it('shows global memberships and protects flock owners', () => {
    render(<AdminPage {...defaultProps} />)

    expect(
      screen.getByRole('heading', { name: 'Memberships (2)' }),
    ).toBeVisible()
    expect(screen.getAllByText('Flock: Morning Miles')).toHaveLength(2)
    expect(screen.getByText('Owner')).toBeVisible()
    expect(
      screen.getByText('Owner memberships cannot be removed here.'),
    ).toBeVisible()
    expect(screen.getByRole('button', { name: 'Remove member' })).toBeVisible()
  })

  it('confirms a membership removal and waits for server success', async () => {
    const onRemoveMembership = vi.fn().mockResolvedValue(undefined)
    render(
      <AdminPage {...defaultProps} onRemoveMembership={onRemoveMembership} />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Remove member' }))
    const dialog = screen.getByRole('dialog', { name: 'Remove member?' })
    expect(dialog).toHaveTextContent(
      'They will lose access to the flock and its flock events.',
    )
    expect(dialog).toHaveTextContent(
      'Their account and personal events stay intact.',
    )

    fireEvent.click(
      within(dialog).getByRole('button', { name: 'Remove member' }),
    )
    await waitFor(() =>
      expect(onRemoveMembership).toHaveBeenCalledWith(memberships[1]),
    )
    await waitFor(() =>
      expect(
        screen.queryByRole('dialog', { name: 'Remove member?' }),
      ).not.toBeInTheDocument(),
    )
    expect(screen.getByRole('status')).toHaveTextContent(
      'Maya Chen was removed from Morning Miles.',
    )
    expect(
      screen.getByRole('heading', { name: 'Memberships (2)' }),
    ).toHaveFocus()
  })

  it('keeps membership-removal recovery in the open dialog', async () => {
    const onRemoveMembership = vi.fn().mockRejectedValue(new Error('offline'))
    const { rerender } = render(
      <AdminPage {...defaultProps} onRemoveMembership={onRemoveMembership} />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Remove member' }))
    const dialog = screen.getByRole('dialog', { name: 'Remove member?' })
    fireEvent.click(
      within(dialog).getByRole('button', { name: 'Remove member' }),
    )
    await waitFor(() => expect(onRemoveMembership).toHaveBeenCalledOnce())

    rerender(
      <AdminPage
        {...defaultProps}
        onRemoveMembership={onRemoveMembership}
        removeMembershipError="We could not remove this member. Check your connection and try again."
      />,
    )
    expect(screen.getByRole('dialog', { name: 'Remove member?' })).toBeVisible()
    expect(screen.getByRole('alert')).toHaveTextContent(
      'We could not remove this member.',
    )
  })

  it('uses membership pagination callbacks and disables boundaries', () => {
    const onMembershipPageChange = vi.fn()
    render(
      <AdminPage
        {...defaultProps}
        onMembershipPageChange={onMembershipPageChange}
        totalMembershipCount={45}
        totalMembershipPages={3}
      />,
    )

    const membershipNavigation = screen.getByRole('navigation', {
      name: 'Membership pages',
    })
    expect(
      within(membershipNavigation).getByRole('button', { name: 'Previous' }),
    ).toBeDisabled()
    fireEvent.click(
      within(membershipNavigation).getByRole('button', { name: 'Next' }),
    )
    expect(onMembershipPageChange).toHaveBeenCalledWith(2)
  })

  it('shows global counts and confirms flock deletion', () => {
    const onDeleteFlock = vi.fn().mockResolvedValue(undefined)
    render(<AdminPage {...defaultProps} onDeleteFlock={onDeleteFlock} />)

    expect(screen.getByRole('heading', { name: 'Flocks (1)' })).toBeVisible()
    expect(screen.getByRole('heading', { name: 'Runners (2)' })).toBeVisible()
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }))
    expect(screen.getByRole('dialog', { name: 'Delete flock?' })).toBeVisible()
    expect(onDeleteFlock).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Keep flock' }))
    expect(
      screen.queryByRole('dialog', { name: 'Delete flock?' }),
    ).not.toBeInTheDocument()
  })
})
