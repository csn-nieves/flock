import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import type { AdminEvent } from '@src/data/admin'
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
const defaultProps = {
  cancelEventError: undefined,
  currentEventPage: 1,
  events: [event],
  flocks: [flock],
  isCancelingEvent: false,
  isDeleting: false,
  onCancelEvent: vi.fn().mockResolvedValue(undefined),
  onDeleteFlock: vi.fn().mockResolvedValue(undefined),
  onDismissCancelEventError: vi.fn(),
  onEventPageChange: vi.fn(),
  totalEventCount: 1,
  totalEventPages: 1,
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
