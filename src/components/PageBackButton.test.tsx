import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import PageBackButton from './PageBackButton'

describe('PageBackButton', () => {
  it('exposes a visible destination and emits back intent', () => {
    const onBack = vi.fn()

    render(<PageBackButton label="Back to your flocks" onBack={onBack} />)

    const button = screen.getByRole('button', { name: 'Back to your flocks' })
    expect(button).toBeVisible()

    fireEvent.click(button)
    expect(onBack).toHaveBeenCalledOnce()
  })
})
