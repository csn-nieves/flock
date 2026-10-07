import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import EventForm from './EventForm'

vi.mock('./RouteMap', () => ({
  default: () => <div>Route preview</div>,
}))

vi.mock('./RouteDrawingDialog', () => ({
  default: ({
    onUseRoute,
  }: {
    onUseRoute: (route: {
      coordinates: [number, number][]
      distanceMeters: number
    }) => void
  }) => (
    <button
      type="button"
      onClick={() =>
        onUseRoute({
          coordinates: [
            [-74.01, 40.7],
            [-74, 40.71],
          ],
          distanceMeters: 1500,
        })
      }
    >
      Use drawn route
    </button>
  ),
}))

describe('EventForm', () => {
  it('validates required fields before submitting', () => {
    const onSubmit = vi.fn()
    render(<EventForm isPending={false} mode="create" onSubmit={onSubmit} />)
    fireEvent.submit(screen.getByRole('button', { name: 'Create event' }))
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('normalizes values and converts local date input', () => {
    const onSubmit = vi.fn()
    render(<EventForm isPending={false} mode="create" onSubmit={onSubmit} />)
    fireEvent.change(screen.getByLabelText('Title'), {
      target: { value: ' Saturday run ' },
    })
    fireEvent.change(screen.getByLabelText('Date and time'), {
      target: { value: '2026-10-03T08:30' },
    })
    fireEvent.change(screen.getByLabelText('Location'), {
      target: { value: ' Riverside ' },
    })
    fireEvent.submit(screen.getByRole('button', { name: 'Create event' }))
    const expectedStartsAt = new Date('2026-10-03T08:30').toISOString()
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Saturday run',
        location: 'Riverside',
        startsAt: expectedStartsAt,
      }),
    )
  })

  it('submits structured distance and pace options for flock events', () => {
    const onSubmit = vi.fn()
    render(
      <EventForm
        includeRunOptions
        isPending={false}
        mode="create"
        onSubmit={onSubmit}
      />,
    )
    fireEvent.change(screen.getByLabelText('Title'), {
      target: { value: 'Saturday run' },
    })
    fireEvent.change(screen.getByLabelText('Date and time'), {
      target: { value: '2026-10-03T08:30' },
    })
    fireEvent.change(screen.getByLabelText('Location'), {
      target: { value: 'Riverside' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Add another option' }))
    fireEvent.click(screen.getAllByRole('radio', { name: 'Kilometers' })[1])
    fireEvent.submit(screen.getByRole('button', { name: 'Create event' }))

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        runOptions: [
          {
            distanceTenths: 50,
            id: undefined,
            paceSeconds: 480,
            unit: 'mi',
          },
          {
            distanceTenths: 50,
            id: undefined,
            paceSeconds: 300,
            unit: 'km',
          },
        ],
      }),
    )
  })

  it('couples distance and pace units and converts pace when units change', () => {
    render(
      <EventForm
        includeRunOptions
        isPending={false}
        mode="create"
        onSubmit={vi.fn()}
      />,
    )

    expect(screen.getByText('5.0 mi')).toBeInTheDocument()
    expect(screen.getByText('8:00/mi')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('radio', { name: 'Kilometers' }))

    expect(screen.getByText('5.0 km')).toBeInTheDocument()
    expect(screen.getByText('5:00/km')).toBeInTheDocument()
    expect(
      screen.getByRole('spinbutton', { name: 'Pace minutes for option 1' }),
    ).toHaveAttribute('aria-valuetext', '5')
  })

  it('imports a GPX route without retaining file metadata', async () => {
    const onSubmit = vi.fn()
    render(
      <EventForm
        includeRunOptions
        isPending={false}
        mode="create"
        onSubmit={onSubmit}
      />,
    )
    fireEvent.change(screen.getByLabelText('Title'), {
      target: { value: 'Mapped run' },
    })
    fireEvent.change(screen.getByLabelText('Date and time'), {
      target: { value: '2026-10-08T08:30' },
    })
    fireEvent.change(screen.getByLabelText('Location'), {
      target: { value: 'Riverside' },
    })
    const file = new File(
      [
        '<gpx><trk><trkseg><trkpt lat="40.70" lon="-74.01"/><trkpt lat="40.71" lon="-74.00"/></trkseg></trk></gpx>',
      ],
      'watch-export.gpx',
      { type: 'application/gpx+xml' },
    )
    fireEvent.change(document.querySelector('input[type="file"]')!, {
      target: { files: [file] },
    })

    await waitFor(() => expect(screen.getByText('Route preview')).toBeVisible())
    fireEvent.submit(screen.getByRole('button', { name: 'Create event' }))

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        runOptions: [
          expect.objectContaining({
            route: expect.objectContaining({
              coordinates: [
                [-74.01, 40.7],
                [-74, 40.71],
              ],
              distanceMeters: expect.any(Number),
            }),
          }),
        ],
      }),
    )
    expect(JSON.stringify(onSubmit.mock.calls[0][0])).not.toContain(
      'watch-export.gpx',
    )
  })

  it('submits a road-following route drawn from the event location', () => {
    const onSubmit = vi.fn()
    render(
      <EventForm
        includeRunOptions
        isPending={false}
        mode="create"
        onSubmit={onSubmit}
      />,
    )
    fireEvent.change(screen.getByLabelText('Title'), {
      target: { value: 'Mapped run' },
    })
    fireEvent.change(screen.getByLabelText('Date and time'), {
      target: { value: '2026-10-08T08:30' },
    })
    fireEvent.change(screen.getByLabelText('Location'), {
      target: { value: 'Riverside Park' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Draw route' }))
    fireEvent.click(screen.getByRole('button', { name: 'Use drawn route' }))
    fireEvent.submit(screen.getByRole('button', { name: 'Create event' }))

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        location: 'Riverside Park',
        runOptions: [
          expect.objectContaining({
            route: {
              coordinates: [
                [-74.01, 40.7],
                [-74, 40.71],
              ],
              distanceMeters: 1500,
            },
          }),
        ],
      }),
    )
  })
})
