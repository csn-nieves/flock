import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import EventForm from './EventForm'

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

  it('requires and submits organizer-defined run options for flock events', () => {
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
    fireEvent.submit(screen.getByRole('button', { name: 'Create event' }))
    expect(screen.getByText('Enter a distance.')).toBeVisible()
    expect(screen.getByText('Enter a pace.')).toBeVisible()
    expect(onSubmit).not.toHaveBeenCalled()

    fireEvent.change(screen.getByLabelText('Distance'), {
      target: { value: ' 5 miles ' },
    })
    fireEvent.change(screen.getByLabelText('Pace'), {
      target: { value: ' Social ' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Add another option' }))
    const distances = screen.getAllByLabelText('Distance')
    const paces = screen.getAllByLabelText('Pace')
    fireEvent.change(distances[1], { target: { value: '10 miles' } })
    fireEvent.change(paces[1], { target: { value: 'Steady' } })
    fireEvent.submit(screen.getByRole('button', { name: 'Create event' }))

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        runOptions: [
          { distanceLabel: '5 miles', id: undefined, paceLabel: 'Social' },
          { distanceLabel: '10 miles', id: undefined, paceLabel: 'Steady' },
        ],
      }),
    )
  })
})
