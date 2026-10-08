import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import EventForm from './EventForm'
import type { SavedRouteLibrary } from '@src/types/savedRoutes'

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
  const savedRouteLibrary: SavedRouteLibrary = {
    isDeleting: false,
    isLoading: false,
    isRenaming: false,
    isSaving: false,
    routes: [
      {
        createdAt: '2026-10-07T12:00:00Z',
        id: 'saved-route',
        name: 'Riverside Loop',
        route: {
          coordinates: [
            [-74.01, 40.7],
            [-74, 40.71],
          ],
          distanceMeters: 1500,
        },
        updatedAt: '2026-10-07T12:00:00Z',
      },
    ],
    status: 'ready',
    onDelete: vi.fn(),
    onRename: vi.fn(),
    onRetry: vi.fn(),
    onSave: vi.fn(),
  }

  it('validates required fields and focuses the first invalid field', () => {
    const onSubmit = vi.fn()
    render(<EventForm isPending={false} mode="create" onSubmit={onSubmit} />)
    fireEvent.submit(screen.getByRole('button', { name: 'Create event' }))
    expect(onSubmit).not.toHaveBeenCalled()
    expect(screen.getByLabelText('Title')).toHaveFocus()
    expect(screen.getByLabelText('Title')).toHaveAttribute(
      'aria-invalid',
      'true',
    )
  })

  it('focuses the next missing required field after earlier fields are valid', () => {
    render(<EventForm isPending={false} mode="create" onSubmit={vi.fn()} />)
    fireEvent.change(screen.getByLabelText('Title'), {
      target: { value: 'Saturday run' },
    })
    fireEvent.submit(screen.getByRole('button', { name: 'Create event' }))

    expect(screen.getByLabelText('Date and time')).toHaveFocus()
  })

  it('focuses a save error so it is visible in a long form', () => {
    const { rerender } = render(
      <EventForm isPending={false} mode="create" onSubmit={vi.fn()} />,
    )

    rerender(
      <EventForm
        error="Check your connection and try again."
        isPending={false}
        mode="create"
        onSubmit={vi.fn()}
      />,
    )

    expect(screen.getByRole('alert')).toHaveFocus()
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

  it('submits a run-at-your-own-pace option without a target pace', () => {
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
      target: { value: 'Open pace run' },
    })
    fireEvent.change(screen.getByLabelText('Date and time'), {
      target: { value: '2026-10-03T08:30' },
    })
    fireEvent.change(screen.getByLabelText('Location'), {
      target: { value: 'Riverside' },
    })

    fireEvent.click(screen.getByRole('radio', { name: 'Run at your own pace' }))

    expect(
      screen.queryByRole('spinbutton', {
        name: 'Pace minutes for option 1',
      }),
    ).not.toBeInTheDocument()
    expect(
      screen.getByText(
        'Runners choose this distance and complete it at their own pace.',
      ),
    ).toBeVisible()

    fireEvent.submit(screen.getByRole('button', { name: 'Create event' }))

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        runOptions: [
          expect.objectContaining({
            distanceTenths: 50,
            paceSeconds: null,
            unit: 'mi',
          }),
        ],
      }),
    )
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

  it('copies a private saved route into a new event option', () => {
    const onSubmit = vi.fn()
    render(
      <EventForm
        includeRunOptions
        isPending={false}
        mode="create"
        savedRouteLibrary={savedRouteLibrary}
        onSubmit={onSubmit}
      />,
    )
    fireEvent.change(screen.getByLabelText('Title'), {
      target: { value: 'Reusable route run' },
    })
    fireEvent.change(screen.getByLabelText('Date and time'), {
      target: { value: '2026-10-09T08:30' },
    })
    fireEvent.change(screen.getByLabelText('Location'), {
      target: { value: 'Riverside' },
    })

    fireEvent.click(screen.getByRole('button', { name: 'Choose saved route' }))
    fireEvent.click(screen.getByRole('button', { name: 'Use this route' }))
    fireEvent.submit(screen.getByRole('button', { name: 'Create event' }))

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        runOptions: [
          expect.objectContaining({
            route: savedRouteLibrary.routes[0].route,
          }),
        ],
      }),
    )
  })
})
