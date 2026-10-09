import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import EventDetailPage from './EventDetailPage'

const event = {
  attendance: {
    groups: [],
    in: 3,
    maybe: 1,
    out: 0,
    response: null,
    runOptionId: null,
  },
  canceledAt: null,
  createdAt: '2026-10-01T00:00:00Z',
  createdBy: 'runner',
  description: 'A sunrise loop with plenty of regroup points.',
  flockId: null,
  id: 'event-1',
  imageUrl: 'https://example.com/event.jpg',
  location: 'Eastbank Esplanade',
  runOptions: [
    {
      distanceLabel: '5 mi',
      distanceTenths: 50,
      id: 'option-1',
      paceLabel: '8:30/mi',
      paceSeconds: 510,
      position: 0,
      route: null,
      unit: 'mi' as const,
    },
  ],
  startsAt: '2026-10-17T12:00:00Z',
  title: 'Bridge-to-Bank Recovery Run',
}

describe('EventDetailPage', () => {
  it('shows the event context and responds with its only run plan', () => {
    const onRespond = vi.fn().mockResolvedValue(undefined)
    const onBack = vi.fn()

    render(
      <EventDetailPage
        event={event}
        isResponding={false}
        onBack={onBack}
        onRespond={onRespond}
      />,
    )

    expect(screen.getByRole('heading', { name: event.title })).toBeVisible()
    expect(screen.getByText('PERSONAL EVENT')).toBeVisible()
    expect(document.querySelector('img')).toHaveAttribute('src', event.imageUrl)
    fireEvent.click(screen.getByRole('button', { name: "I'm in" }))
    expect(onRespond).toHaveBeenCalledWith('event-1', 'in', 'option-1')
    fireEvent.click(screen.getByRole('button', { name: /Back to events/ }))
    expect(onBack).toHaveBeenCalledOnce()
  })

  it('asks for a plan when a response has multiple options', () => {
    const onRespond = vi.fn().mockResolvedValue(undefined)
    const eventWithOptions = {
      ...event,
      runOptions: [
        event.runOptions[0],
        { ...event.runOptions[0], id: 'option-2', distanceLabel: '10 km' },
      ],
    }
    render(
      <EventDetailPage
        event={eventWithOptions}
        isResponding={false}
        onBack={vi.fn()}
        onRespond={onRespond}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: "I'm in" }))
    const dialog = screen.getByRole('dialog', { name: "I'm in" })
    expect(within(dialog).getByText('10 km · 8:30/mi')).toBeVisible()
    fireEvent.click(
      within(dialog).getByRole('button', { name: 'Confirm plan' }),
    )
    expect(onRespond).toHaveBeenCalledWith('event-1', 'in', 'option-1')
  })
})
