import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import CreateFlockForm from './CreateFlockForm'

describe('CreateFlockForm', () => {
  it('submits a normalized flock name', () => {
    const handleSubmit = vi.fn()
    render(<CreateFlockForm onSubmit={handleSubmit} />)

    fireEvent.change(screen.getByRole('textbox', { name: 'Flock name' }), {
      target: { value: '  Sunrise Striders  ' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Create flock' }))

    expect(handleSubmit).toHaveBeenCalledWith('Sunrise Striders')
  })

  it('shows a required error and focuses the name field', () => {
    const handleSubmit = vi.fn()
    render(<CreateFlockForm onSubmit={handleSubmit} />)

    fireEvent.click(screen.getByRole('button', { name: 'Create flock' }))

    const input = screen.getByRole('textbox', { name: 'Flock name' })
    expect(input).toHaveFocus()
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(input).toHaveAccessibleDescription('Error: Enter a flock name.')
    expect(handleSubmit).not.toHaveBeenCalled()
  })

  it('revalidates a name that exceeds the database limit', () => {
    render(<CreateFlockForm onSubmit={vi.fn()} />)
    const input = screen.getByRole('textbox', { name: 'Flock name' })

    fireEvent.change(input, { target: { value: 'a'.repeat(81) } })
    fireEvent.click(screen.getByRole('button', { name: 'Create flock' }))
    expect(input).toHaveAccessibleDescription(
      'Error: Use 80 characters or fewer.',
    )

    fireEvent.change(input, { target: { value: 'a'.repeat(80) } })
    expect(input).toHaveAccessibleDescription(
      'Choose a name runners will recognize. 80 characters maximum.',
    )
    expect(input).not.toHaveAttribute('aria-invalid', 'true')
  })

  it('presents a recoverable creation error', () => {
    render(
      <CreateFlockForm
        error="We could not create your flock. Check your connection and try again."
        initialName="Sunrise Striders"
        onSubmit={vi.fn()}
      />,
    )

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Error: We could not create your flock. Check your connection and try again.',
    )
    expect(
      screen.queryByText(
        'Choose a name runners will recognize. 80 characters maximum.',
      ),
    ).not.toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Flock name' })).toHaveValue(
      'Sunrise Striders',
    )
  })

  it('prevents duplicate submissions while a flock is being created', () => {
    const handleSubmit = vi.fn()
    render(
      <CreateFlockForm
        initialName="Sunrise Striders"
        isSubmitting
        onSubmit={handleSubmit}
      />,
    )

    const button = screen.getByRole('button', { name: 'Creating flock' })
    const form = button.closest('form')
    expect(form).toHaveAttribute('aria-busy', 'true')
    expect(screen.getByRole('textbox', { name: 'Flock name' })).toBeDisabled()
    expect(button).toBeDisabled()
    expect(screen.getByRole('status')).toHaveTextContent('Creating flock')

    fireEvent.submit(form!)
    expect(handleSubmit).not.toHaveBeenCalled()
  })

  it('can be disabled by a competing action', () => {
    const handleSubmit = vi.fn()
    render(<CreateFlockForm disabled onSubmit={handleSubmit} />)

    const button = screen.getByRole('button', { name: 'Create flock' })
    const form = button.closest('form')
    expect(screen.getByRole('textbox', { name: 'Flock name' })).toBeDisabled()
    expect(button).toBeDisabled()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()

    fireEvent.submit(form!)
    expect(handleSubmit).not.toHaveBeenCalled()
  })
})
