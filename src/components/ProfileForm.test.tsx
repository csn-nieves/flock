import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import ProfileForm from './ProfileForm'

describe('ProfileForm', () => {
  it('submits trimmed display name and nullable location', () => {
    const onSubmit = vi.fn()
    render(
      <ProfileForm
        initialDisplayName="Runner"
        initialLocation=""
        onSubmit={onSubmit}
      />,
    )
    fireEvent.change(screen.getByLabelText('Display name'), {
      target: { value: ' New Runner ' },
    })
    fireEvent.submit(screen.getByRole('button', { name: 'Save profile' }))
    expect(onSubmit).toHaveBeenCalledWith({
      displayName: 'New Runner',
      location: null,
    })
  })

  it('does not submit an empty display name', () => {
    const onSubmit = vi.fn()
    render(
      <ProfileForm
        initialDisplayName=""
        initialLocation={null}
        onSubmit={onSubmit}
      />,
    )
    fireEvent.submit(screen.getByRole('button', { name: 'Save profile' }))
    expect(screen.getByText('Enter a display name.')).toBeVisible()
    expect(onSubmit).not.toHaveBeenCalled()
  })
})
