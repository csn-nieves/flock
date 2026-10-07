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
})
