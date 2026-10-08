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
    const dialog = screen.getByRole('dialog', { name: 'Dialog' })
    expect(dialog).toBeVisible()
    expect(dialog.firstElementChild).toHaveClass('overflow-hidden')
    expect(
      dialog.querySelector<HTMLElement>('[data-modal-scroll-area]'),
    ).toHaveClass('overflow-y-auto')
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

  it('supports a wider desktop surface without changing its phone width', () => {
    render(
      <Modal
        description="Plot a road-following course."
        onClose={vi.fn()}
        size="wide"
        title="Draw a route"
      >
        <p>Map</p>
      </Modal>,
    )

    expect(
      screen.getByRole('dialog', { name: 'Draw a route' }).firstElementChild,
    ).toHaveClass('max-w-app', 'sm:max-w-3xl')
  })
})
