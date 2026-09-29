import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import TextField from './TextField'

describe('TextField', () => {
  it('associates its visible label with the input', () => {
    render(<TextField label="Email address" />)

    const input = screen.getByRole('textbox', { name: 'Email address' })
    const label = screen.getByText('Email address')

    expect(label).toHaveAttribute('for', input.id)
  })

  it('forwards native input metadata and changes', () => {
    const handleChange = vi.fn()

    render(
      <TextField
        autoComplete="email"
        inputMode="email"
        label="Email address"
        name="email"
        type="email"
        onChange={handleChange}
      />,
    )

    const input = screen.getByRole('textbox', { name: 'Email address' })
    fireEvent.change(input, { target: { value: 'runner@example.com' } })

    expect(input).toHaveAttribute('autocomplete', 'email')
    expect(input).toHaveAttribute('inputmode', 'email')
    expect(input).toHaveAttribute('name', 'email')
    expect(input).toHaveAttribute('type', 'email')
    expect(handleChange).toHaveBeenCalledOnce()
  })

  it('connects hint text to the input description', () => {
    render(
      <TextField
        id="email"
        hint="We will send a six-digit code."
        label="Email address"
      />,
    )

    const input = screen.getByRole('textbox', { name: 'Email address' })
    const hint = screen.getByText('We will send a six-digit code.')

    expect(input).toHaveAttribute('aria-describedby', hint.id)
  })

  it('exposes invalid state and linked recovery guidance', () => {
    render(
      <TextField
        error="Enter a valid email address."
        hint="We will send a six-digit code."
        label="Email address"
      />,
    )

    const input = screen.getByRole('textbox', { name: 'Email address' })
    const error = screen.getByRole('alert')

    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(input).toHaveAttribute('aria-describedby', error.id)
    expect(error).toHaveTextContent('Error: Enter a valid email address.')
    expect(
      screen.queryByText('We will send a six-digit code.'),
    ).not.toBeInTheDocument()
  })

  it('exposes the native disabled state', () => {
    render(<TextField disabled label="Email address" />)

    expect(
      screen.getByRole('textbox', { name: 'Email address' }),
    ).toBeDisabled()
  })
})
