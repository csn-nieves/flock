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
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Saturday run',
        location: 'Riverside',
        startsAt: '2026-10-03T12:30:00.000Z',
      }),
    )
  })
})
