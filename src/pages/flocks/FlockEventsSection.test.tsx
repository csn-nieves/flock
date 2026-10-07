import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import FlockEventsSection from './FlockEventsSection'

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
  createdBy: 'owner',
  description: '',
  flockId: 'flock',
  id: 'event',
  location: 'Riverside',
  runOptions: [],
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
        isResponding={false}
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

  it('groups attendance and requires a run choice for in or maybe', async () => {
    const onRespond = vi.fn().mockResolvedValue(undefined)
    const eventWithOptions = {
      ...event,
      attendance: {
        groups: [
          { in: 2, maybe: 1, runOptionId: 'five-mile-option' },
          { in: 1, maybe: 0, runOptionId: 'ten-mile-option' },
        ],
        in: 3,
        maybe: 1,
        out: 0,
        response: null,
        runOptionId: null,
      },
      runOptions: [
        {
          distanceLabel: '5 mi',
          distanceTenths: 50,
          id: 'five-mile-option',
          paceLabel: '8:00/mi',
          paceSeconds: 480,
          position: 0,
          unit: 'mi' as const,
        },
        {
          distanceLabel: '10 mi',
          distanceTenths: 100,
          id: 'ten-mile-option',
          paceLabel: '8:30/mi',
          paceSeconds: 510,
          position: 1,
          unit: 'mi' as const,
        },
      ],
    }
    render(
      <FlockEventsSection
        canCreate={false}
        events={[eventWithOptions]}
        isCanceling={false}
        isLoading={false}
        isResponding={false}
        isSaving={false}
        onCancel={vi.fn()}
        onCreate={vi.fn()}
        onRespond={onRespond}
        onRetry={vi.fn()}
        onUpdate={vi.fn()}
      />,
    )

    expect(screen.getByText('5 mi · 8:00/mi')).toBeVisible()
    expect(screen.getByText('2 in · 1 maybe')).toBeVisible()
    fireEvent.click(screen.getByRole('button', { name: "I'm in" }))
    const dialog = screen.getByRole('dialog', { name: 'Choose your run' })
    const dialogQueries = within(dialog)
    fireEvent.click(dialogQueries.getByRole('radio', { name: '10 mi8:30/mi' }))
    fireEvent.click(
      dialogQueries.getByRole('button', { name: 'Save response' }),
    )

    await waitFor(() =>
      expect(onRespond).toHaveBeenCalledWith(event.id, 'in', 'ten-mile-option'),
    )
    expect(dialog).not.toBeInTheDocument()
  })
})
