import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import FlockEventsSection from './FlockEventsSection'

const event = {
  attendance: { in: 0, maybe: 0, out: 0, response: null },
  canceledAt: null,
  createdAt: '2026-10-01T00:00:00Z',
  createdBy: 'owner',
  description: '',
  flockId: 'flock',
  id: 'event',
  location: 'Riverside',
  startsAt: '2026-10-03T12:00:00Z',
  title: 'Saturday run',
}

describe('FlockEventsSection', () => {
  it('uses full-width management actions with a danger cancel button', () => {
    render(
      <FlockEventsSection
        canCreate
        events={[event]}
        isCanceling={false}
        isLoading={false}
        isSaving={false}
        onCancel={vi.fn().mockResolvedValue(undefined)}
        onCreate={vi.fn()}
        onRespond={vi.fn()}
        onRetry={vi.fn()}
        onUpdate={vi.fn().mockResolvedValue(undefined)}
      />,
    )

    expect(screen.getByRole('button', { name: 'Edit event' })).toHaveClass(
      'w-full',
    )
    expect(screen.getByRole('button', { name: 'Cancel event' })).toHaveClass(
      'bg-danger',
      'w-full',
    )
    expect(
      screen.queryByRole('button', { name: 'Invite runners' }),
    ).not.toBeInTheDocument()
  })
})
