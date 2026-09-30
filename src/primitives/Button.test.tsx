import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import Button from './Button'

describe('Button', () => {
  it('renders a primary button with a safe default type', () => {
    render(<Button onClick={vi.fn()}>Join a flock</Button>)

    const button = screen.getByRole('button', { name: 'Join a flock' })

    expect(button).toHaveAttribute('type', 'button')
    expect(button).toHaveClass('bg-primary', 'text-on-primary')
  })

  it('supports the secondary variant and native button props', () => {
    render(
      <Button
        variant="secondary"
        type="submit"
        aria-label="Continue with email"
      >
        Email
      </Button>,
    )

    const button = screen.getByRole('button', { name: 'Continue with email' })

    expect(button).toHaveAttribute('type', 'submit')
    expect(button).toHaveClass('border-border', 'bg-background', 'text-text')
  })

  it('forwards click events when enabled', () => {
    const handleClick = vi.fn()

    render(<Button onClick={handleClick}>Create flock</Button>)
    fireEvent.click(screen.getByRole('button', { name: 'Create flock' }))

    expect(handleClick).toHaveBeenCalledOnce()
  })

  it('does not fire click events when disabled', () => {
    const handleClick = vi.fn()

    render(
      <Button disabled onClick={handleClick}>
        Create flock
      </Button>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Create flock' }))

    expect(handleClick).not.toHaveBeenCalled()
  })

  it('shows and announces an action-specific pending state', () => {
    const handleClick = vi.fn()

    render(
      <Button isPending pendingLabel="Creating flock" onClick={handleClick}>
        Create flock
      </Button>,
    )

    const button = screen.getByRole('button', { name: 'Creating flock' })
    expect(button).toBeDisabled()
    expect(button).toHaveAttribute('aria-busy', 'true')
    expect(screen.getByRole('status')).toHaveTextContent('Creating flock')

    fireEvent.click(button)
    expect(handleClick).not.toHaveBeenCalled()
  })

  it('keeps pending geometry reserved while idle', () => {
    render(
      <Button isPending={false} pendingLabel="Creating flock" onClick={vi.fn()}>
        Create flock
      </Button>,
    )

    const button = screen.getByRole('button', { name: 'Create flock' })
    expect(button).toBeEnabled()
    expect(button).not.toHaveAttribute('aria-busy')
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })
})
