import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import EmailOtpForm from './EmailOtpForm'

const email = 'runner@example.com'

describe('EmailOtpForm', () => {
  it('shows the submitted email and allows changing it', () => {
    const handleChangeEmail = vi.fn()
    render(
      <EmailOtpForm
        email={email}
        onChangeEmail={handleChangeEmail}
        onResend={vi.fn()}
        onSubmit={vi.fn()}
      />,
    )

    expect(screen.getByText(email)).toBeVisible()
    fireEvent.click(screen.getByRole('button', { name: 'Change email' }))
    expect(handleChangeEmail).toHaveBeenCalledOnce()
  })

  it('submits a normalized six-digit code', () => {
    const handleSubmit = vi.fn()
    render(
      <EmailOtpForm
        email={email}
        initialCode="123456"
        onChangeEmail={vi.fn()}
        onResend={vi.fn()}
        onSubmit={handleSubmit}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Verify code' }))
    expect(handleSubmit).toHaveBeenCalledWith('123456')
  })

  it('shows a required error and focuses the code field', () => {
    const handleSubmit = vi.fn()
    render(
      <EmailOtpForm
        email={email}
        onChangeEmail={vi.fn()}
        onResend={vi.fn()}
        onSubmit={handleSubmit}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Verify code' }))

    const input = screen.getByRole('textbox', { name: 'Six-digit code' })
    expect(input).toHaveFocus()
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(input).toHaveAccessibleDescription(
      'Error: Enter the six-digit code.',
    )
    expect(handleSubmit).not.toHaveBeenCalled()
  })

  it('revalidates an incomplete code as it changes', () => {
    render(
      <EmailOtpForm
        email={email}
        onChangeEmail={vi.fn()}
        onResend={vi.fn()}
        onSubmit={vi.fn()}
      />,
    )
    const input = screen.getByRole('textbox', { name: 'Six-digit code' })

    fireEvent.change(input, { target: { value: '12345' } })
    fireEvent.click(screen.getByRole('button', { name: 'Verify code' }))
    expect(input).toHaveAccessibleDescription(
      'Error: Enter all six digits from your email.',
    )

    fireEvent.change(input, { target: { value: '123456' } })
    expect(input).toHaveAccessibleDescription('Enter the code from your email.')
    expect(input).not.toHaveAttribute('aria-invalid', 'true')
  })

  it('presents a recoverable verification error in the supporting text slot', () => {
    render(
      <EmailOtpForm
        email={email}
        error="That code is invalid or has expired. Check the code and try again."
        initialCode="123456"
        onChangeEmail={vi.fn()}
        onResend={vi.fn()}
        onSubmit={vi.fn()}
      />,
    )

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Error: That code is invalid or has expired. Check the code and try again.',
    )
    expect(
      screen.queryByText('Enter the code from your email.'),
    ).not.toBeInTheDocument()
  })

  it('prevents actions while the code is being verified', () => {
    const handleChangeEmail = vi.fn()
    const handleSubmit = vi.fn()
    render(
      <EmailOtpForm
        email={email}
        initialCode="123456"
        isSubmitting
        onChangeEmail={handleChangeEmail}
        onResend={vi.fn()}
        onSubmit={handleSubmit}
      />,
    )

    const form = screen
      .getByRole('button', { name: 'Verify code' })
      .closest('form')
    expect(form).toHaveAttribute('aria-busy', 'true')
    expect(
      screen.getByRole('textbox', { name: 'Six-digit code' }),
    ).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Change email' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Verify code' })).toBeDisabled()
    expect(screen.getByRole('status')).toHaveTextContent('Verifying code.')

    fireEvent.submit(form!)
    expect(handleChangeEmail).not.toHaveBeenCalled()
    expect(handleSubmit).not.toHaveBeenCalled()
  })

  it('emits resend intent when another code is available', () => {
    const handleResend = vi.fn()
    render(
      <EmailOtpForm
        email={email}
        onChangeEmail={vi.fn()}
        onResend={handleResend}
        onSubmit={vi.fn()}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Send another code' }))
    expect(handleResend).toHaveBeenCalledOnce()
  })

  it('disables resend and explains the remaining cooldown', () => {
    render(
      <EmailOtpForm
        email={email}
        resendAvailableInSeconds={42}
        onChangeEmail={vi.fn()}
        onResend={vi.fn()}
        onSubmit={vi.fn()}
      />,
    )

    const resendButton = screen.getByRole('button', {
      name: 'Send another code',
    })
    expect(resendButton).toBeDisabled()
    expect(resendButton).toHaveAccessibleDescription(
      'You can request another code in 42 seconds.',
    )
    expect(
      screen.getByText('You can request another code in 42 seconds.'),
    ).toBeVisible()
  })

  it('keeps resend available after a recoverable resend error', () => {
    render(
      <EmailOtpForm
        email={email}
        resendError="We could not send another code. Check your connection and try again."
        onChangeEmail={vi.fn()}
        onResend={vi.fn()}
        onSubmit={vi.fn()}
      />,
    )

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Error: We could not send another code. Check your connection and try again.',
    )
    expect(
      screen.getByRole('button', { name: 'Send another code' }),
    ).toBeEnabled()
  })

  it('prevents competing actions while another code is being sent', () => {
    render(
      <EmailOtpForm
        email={email}
        isResending
        onChangeEmail={vi.fn()}
        onResend={vi.fn()}
        onSubmit={vi.fn()}
      />,
    )

    expect(
      screen.getByRole('textbox', { name: 'Six-digit code' }),
    ).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Change email' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Verify code' })).toBeDisabled()
    expect(
      screen.getByRole('button', { name: 'Send another code' }),
    ).toBeDisabled()
    expect(screen.getByRole('status')).toHaveTextContent(
      'Sending another code.',
    )
  })
})
