import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import FlockDetailsForm from './FlockDetailsForm'

const flockDetails = {
  description: 'Friendly miles for every pace.',
  location: 'Portland, Oregon',
  name: 'Sunrise Striders',
}

function fillRequiredFields() {
  fireEvent.change(screen.getByRole('textbox', { name: 'Flock name' }), {
    target: { value: `  ${flockDetails.name}  ` },
  })
  fireEvent.change(screen.getByRole('textbox', { name: 'Location' }), {
    target: { value: `  ${flockDetails.location}  ` },
  })
  fireEvent.change(screen.getByRole('textbox', { name: 'Description' }), {
    target: { value: `  ${flockDetails.description}  ` },
  })
}

describe('FlockDetailsForm', () => {
  it('submits normalized flock details', () => {
    const handleSubmit = vi.fn()
    render(<FlockDetailsForm mode="create" onSubmit={handleSubmit} />)

    fillRequiredFields()
    fireEvent.click(screen.getByRole('button', { name: 'Create flock' }))

    expect(handleSubmit).toHaveBeenCalledWith(flockDetails)
  })

  it('focuses the first invalid field and validates every required detail', () => {
    const handleSubmit = vi.fn()
    render(<FlockDetailsForm mode="create" onSubmit={handleSubmit} />)

    fireEvent.click(screen.getByRole('button', { name: 'Create flock' }))

    const nameInput = screen.getByRole('textbox', { name: 'Flock name' })
    expect(nameInput).toHaveFocus()
    expect(nameInput).toHaveAccessibleDescription('Error: Enter a flock name.')
    expect(
      screen.getByRole('textbox', { name: 'Location' }),
    ).toHaveAccessibleDescription('Error: Enter a location.')
    expect(
      screen.getByRole('textbox', { name: 'Description' }),
    ).toHaveAccessibleDescription('Error: Enter a short description.')
    expect(handleSubmit).not.toHaveBeenCalled()
  })

  it('revalidates a name that exceeds the database limit', () => {
    render(<FlockDetailsForm mode="create" onSubmit={vi.fn()} />)
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

  it('preserves every field after a recoverable save error', () => {
    render(
      <FlockDetailsForm
        error="Check your connection and try again."
        initialValues={flockDetails}
        mode="edit"
        onSubmit={vi.fn()}
      />,
    )

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Could not save: Check your connection and try again.',
    )
    expect(screen.getByRole('textbox', { name: 'Flock name' })).toHaveValue(
      flockDetails.name,
    )
    expect(screen.getByRole('textbox', { name: 'Location' })).toHaveValue(
      flockDetails.location,
    )
    expect(screen.getByRole('textbox', { name: 'Description' })).toHaveValue(
      flockDetails.description,
    )
  })

  it('uses edit vocabulary and emits cancel intent', () => {
    const handleCancel = vi.fn()
    render(
      <FlockDetailsForm
        initialValues={flockDetails}
        mode="edit"
        onCancel={handleCancel}
        onSubmit={vi.fn()}
      />,
    )

    expect(screen.getByRole('button', { name: 'Save changes' })).toBeEnabled()
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(handleCancel).toHaveBeenCalledOnce()
  })

  it('prevents duplicate submissions while a flock is being saved', () => {
    const handleSubmit = vi.fn()
    render(
      <FlockDetailsForm
        initialValues={flockDetails}
        isSubmitting
        mode="edit"
        onSubmit={handleSubmit}
      />,
    )

    const button = screen.getByRole('button', { name: 'Saving changes' })
    const form = button.closest('form')
    expect(form).toHaveAttribute('aria-busy', 'true')
    expect(screen.getByRole('textbox', { name: 'Flock name' })).toBeDisabled()
    expect(button).toBeDisabled()
    expect(screen.getByRole('status')).toHaveTextContent('Saving changes')

    fireEvent.submit(form!)
    expect(handleSubmit).not.toHaveBeenCalled()
  })
})
