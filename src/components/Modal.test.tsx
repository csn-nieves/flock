import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import Modal from './Modal'

describe('Modal', () => {
  it('renders an accessible dialog and closes on Escape', () => {
    const onClose = vi.fn()
    render(
      <Modal description="Description" onClose={onClose} title="Dialog">
        <p>Content</p>
      </Modal>,
    )
    expect(screen.getByRole('dialog', { name: 'Dialog' })).toBeVisible()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledOnce()
  })
})
