import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import RouteDrawingDialog from './RouteDrawingDialog'

const planSegment = vi.fn()
const locate = vi.fn()
let isConfigured = true

vi.mock('@src/hooks/useRoutePlanner', () => ({
  useRoutePlanner: () => ({
    isConfigured,
    locate,
    planSegment,
  }),
}))

vi.mock('./RouteDrawingMap', () => ({
  default: ({
    onAddPoint,
  }: {
    onAddPoint: (point: [number, number]) => void
  }) => (
    <button type="button" onClick={() => onAddPoint([-74, 40.7])}>
      Add test point
    </button>
  ),
}))

beforeEach(() => {
  isConfigured = true
  locate.mockReset().mockResolvedValue(undefined)
  planSegment.mockReset().mockResolvedValue({
    coordinates: [
      [-74, 40.7],
      [-73.99, 40.71],
    ],
    distanceMeters: 1200,
  })
})

describe('RouteDrawingDialog', () => {
  it('plans each added segment and returns a provider-neutral route', async () => {
    const onUseRoute = vi.fn()
    render(
      <RouteDrawingDialog
        location="Riverside Park"
        unit="mi"
        onClose={vi.fn()}
        onUseRoute={onUseRoute}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Add test point' }))
    fireEvent.click(screen.getByRole('button', { name: 'Add test point' }))

    await waitFor(() => expect(planSegment).toHaveBeenCalledOnce())
    expect(screen.getByText('0.75 mi')).toBeVisible()
    fireEvent.click(screen.getByRole('button', { name: 'Use this route' }))
    expect(onUseRoute).toHaveBeenCalledWith({
      coordinates: [
        [-74, 40.7],
        [-73.99, 40.71],
      ],
      distanceMeters: 1200,
    })
  })

  it('keeps the draft and shows recovery when a segment cannot be planned', async () => {
    planSegment.mockRejectedValueOnce(new Error('unavailable'))
    render(
      <RouteDrawingDialog
        location="Riverside Park"
        unit="km"
        onClose={vi.fn()}
        onUseRoute={vi.fn()}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Add test point' }))
    fireEvent.click(screen.getByRole('button', { name: 'Add test point' }))

    expect(
      await screen.findByText(
        'We could not plan that part of the route. Try again.',
      ),
    ).toBeVisible()
    expect(screen.getByText('1 of 25 points')).toBeVisible()
  })

  it('undoes and clears without another provider request', async () => {
    render(
      <RouteDrawingDialog
        location="Riverside Park"
        unit="km"
        onClose={vi.fn()}
        onUseRoute={vi.fn()}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Add test point' }))
    fireEvent.click(screen.getByRole('button', { name: 'Add test point' }))
    await screen.findByText('1.20 km')
    fireEvent.click(screen.getByRole('button', { name: 'Undo last point' }))
    expect(screen.getByText('1 of 25 points')).toBeVisible()
    fireEvent.click(screen.getByRole('button', { name: 'Clear route' }))
    expect(screen.getByText('0 of 25 points')).toBeVisible()
    expect(planSegment).toHaveBeenCalledOnce()
  })

  it('keeps the GPX fallback available when route planning is not configured', () => {
    isConfigured = false
    render(
      <RouteDrawingDialog
        location="Riverside Park"
        unit="mi"
        onClose={vi.fn()}
        onUseRoute={vi.fn()}
      />,
    )

    expect(
      screen.getByText('Route drawing is not available here yet.'),
    ).toBeVisible()
    expect(screen.getByText(/attach a GPX file instead/)).toBeVisible()
    expect(
      screen.getByRole('button', { name: 'Use this route' }),
    ).toBeDisabled()
  })
})
