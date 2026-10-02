import { useState } from 'react'
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

  it('keeps focus inside changing dialog content after a parent rerender', () => {
    const onClose = vi.fn()

    function ModalHarness() {
      const [value, setValue] = useState('')

      return (
        <Modal
          description="Search for an invitation audience."
          onClose={() => onClose(value)}
          title="Choose an audience"
        >
          <label htmlFor="audience-search">Audience</label>
          <input
            id="audience-search"
            value={value}
            onChange={(event) => setValue(event.target.value)}
          />
        </Modal>
      )
    }

    render(<ModalHarness />)
    const search = screen.getByRole('textbox', { name: 'Audience' })

    search.focus()
    fireEvent.change(search, { target: { value: 'harbor' } })

    expect(search).toHaveFocus()
    expect(search).toHaveValue('harbor')

    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledWith('harbor')
  })
})
