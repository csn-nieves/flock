import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import EmailSignInForm from './EmailSignInForm'

describe('EmailSignInForm', () => {
  it('submits a normalized valid email address', () => {
    const handleSubmit = vi.fn()
    render(<EmailSignInForm onSubmit={handleSubmit} />)

    fireEvent.change(screen.getByRole('textbox', { name: 'Email address' }), {
      target: { value: '  runner@example.com  ' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Send code' }))

    expect(handleSubmit).toHaveBeenCalledWith('runner@example.com')
  })

  it('shows a required error and focuses the email field', () => {
    const handleSubmit = vi.fn()
    render(<EmailSignInForm onSubmit={handleSubmit} />)

    fireEvent.click(screen.getByRole('button', { name: 'Send code' }))

    const input = screen.getByRole('textbox', { name: 'Email address' })
    expect(input).toHaveFocus()
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(input).toHaveAccessibleDescription(
      'Error: Enter your email address.',
    )
    expect(handleSubmit).not.toHaveBeenCalled()
  })

  it('revalidates an invalid email as it changes', () => {
    render(<EmailSignInForm onSubmit={vi.fn()} />)
    const input = screen.getByRole('textbox', { name: 'Email address' })

    fireEvent.change(input, { target: { value: 'runner' } })
    fireEvent.click(screen.getByRole('button', { name: 'Send code' }))
    expect(input).toHaveAccessibleDescription(
      'Error: Enter a valid email address.',
    )

    fireEvent.change(input, { target: { value: 'runner@example.com' } })
    expect(input).toHaveAccessibleDescription(
      'We will send you a six-digit code.',
    )
    expect(input).not.toHaveAttribute('aria-invalid', 'true')
  })

  it('presents a recoverable form error', () => {
    render(
      <EmailSignInForm
        error="We could not send a code. Check your connection and try again."
        onSubmit={vi.fn()}
      />,
    )

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Error: We could not send a code. Check your connection and try again.',
    )
    expect(
      screen.queryByText('We will send you a six-digit code.'),
    ).not.toBeInTheDocument()
  })

  it('prevents duplicate submissions while a code is being sent', () => {
    const handleSubmit = vi.fn()
    render(
      <EmailSignInForm
        initialEmail="runner@example.com"
        isSubmitting
        onSubmit={handleSubmit}
      />,
    )

    const form = screen
      .getByRole('button', { name: 'Send code' })
      .closest('form')
    expect(form).toHaveAttribute('aria-busy', 'true')
    expect(
      screen.getByRole('textbox', { name: 'Email address' }),
    ).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Send code' })).toBeDisabled()
    expect(screen.getByRole('status')).toHaveTextContent('Sending code.')

    fireEvent.submit(form!)
    expect(handleSubmit).not.toHaveBeenCalled()
  })
})
