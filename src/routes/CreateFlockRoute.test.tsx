import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import CreateFlockRoute from './CreateFlockRoute'

const createFlockMutation = vi.hoisted(() => ({
  error: null as Error | null,
  isError: false,
  isPending: false,
  mutate: vi.fn(),
}))

vi.mock('@src/hooks/useCreateFlock', () => ({
  useCreateFlock: () => createFlockMutation,
}))

describe('CreateFlockRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    createFlockMutation.error = null
    createFlockMutation.isError = false
    createFlockMutation.isPending = false
  })

  it('sets route metadata and forwards a normalized name to the mutation', () => {
    render(<CreateFlockRoute />)

    expect(document.title).toBe('Create a flock — Flock')

    fireEvent.change(screen.getByRole('textbox', { name: 'Flock name' }), {
      target: { value: '  Sunrise Striders  ' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Create flock' }))

    expect(createFlockMutation.mutate).toHaveBeenCalledWith({
      name: 'Sunrise Striders',
    })
  })

  it('maps pending mutation state to stable, duplicate-safe form progress', () => {
    createFlockMutation.isPending = true
    render(<CreateFlockRoute />)

    const button = screen.getByRole('button', { name: 'Creating flock' })
    expect(button).toBeDisabled()
    expect(button).toHaveAttribute('aria-busy', 'true')
    expect(screen.getByRole('textbox', { name: 'Flock name' })).toBeDisabled()

    fireEvent.click(button)
    expect(createFlockMutation.mutate).not.toHaveBeenCalled()
  })

  it('presents a safe recoverable error without exposing transport details', () => {
    const view = render(<CreateFlockRoute />)
    const input = screen.getByRole('textbox', { name: 'Flock name' })

    fireEvent.change(input, { target: { value: 'Sunrise Striders' } })
    createFlockMutation.error = new Error('raw database failure')
    createFlockMutation.isError = true
    view.rerender(<CreateFlockRoute />)

    expect(screen.getByRole('alert')).toHaveTextContent(
      'We could not create your flock. Check your connection and try again.',
    )
    expect(screen.queryByText('raw database failure')).not.toBeInTheDocument()
    expect(input).toHaveValue('Sunrise Striders')
    expect(screen.getByRole('button', { name: 'Create flock' })).toBeEnabled()
  })
})
