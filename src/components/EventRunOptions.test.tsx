import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import EventRunOptions from './EventRunOptions'

vi.mock('./RouteMap', () => ({
  default: ({ size }: { size?: string }) => (
    <div data-size={size}>Interactive route map</div>
  ),
}))

describe('EventRunOptions', () => {
  it('opens a mapped route while preserving run-option context', () => {
    render(
      <EventRunOptions
        groups={[{ in: 3, maybe: 1, runOptionId: 'option-1' }]}
        options={[
          {
            distanceLabel: '5 mi',
            distanceTenths: 50,
            id: 'option-1',
            paceLabel: '8:00/mi',
            paceSeconds: 480,
            position: 0,
            route: {
              coordinates: [
                [-74.01, 40.7],
                [-74, 40.71],
              ],
              distanceMeters: 8047,
            },
            unit: 'mi',
          },
        ]}
        response="in"
        selectedRunOptionId="option-1"
      />,
    )

    expect(screen.getByText('Mapped route · 5.00 mi')).toBeVisible()
    expect(screen.getByText('Your choice')).toBeVisible()
    fireEvent.click(screen.getByRole('button', { name: 'View map' }))

    expect(screen.getByRole('dialog', { name: 'Event route' })).toBeVisible()
    expect(screen.getByText('Interactive route map')).toHaveAttribute(
      'data-size',
      'large',
    )
    expect(
      screen.getByRole('dialog', { name: 'Event route' }).firstElementChild,
    ).toHaveClass('sm:max-w-3xl')
  })
})
