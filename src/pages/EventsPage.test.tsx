import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import EventsPage from './EventsPage'

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

describe('EventsPage', () => {
  it('shows an empty state and opens the create modal', () => {
    render(
      <EventsPage
        events={[]}
        isCreating={false}
        isInviting={false}
        isRefreshing={false}
        onCopyInvitation={vi.fn()}
        onCreate={vi.fn()}
        onInvite={vi.fn()}
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
        events={[event]}
        isCreating={false}
        isInviting={false}
        isRefreshing={false}
        onCopyInvitation={vi.fn()}
        onCreate={vi.fn()}
        onInvite={vi.fn()}
      />,
    )
    expect(screen.getByRole('heading', { name: 'Saturday run' })).toBeVisible()
    expect(screen.getByText(/Riverside/)).toBeVisible()
  })
})
