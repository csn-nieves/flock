import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import SettingsPage from './SettingsPage'

describe('SettingsPage', () => {
  it('renders all appearance choices and selects the current preference', () => {
    const onThemeChange = vi.fn()
    render(<SettingsPage onThemeChange={onThemeChange} preference="system" />)
    expect(screen.getByRole('heading', { name: 'Settings' })).toBeVisible()
    expect(screen.getByRole('heading', { name: 'Appearance' })).toBeVisible()
    expect(
      screen.getByRole('radio', { name: 'Use device setting' }),
    ).toBeChecked()
    expect(screen.getByRole('radio', { name: 'Light mode' })).not.toBeChecked()
    expect(screen.getByRole('radio', { name: 'Dark mode' })).not.toBeChecked()

    fireEvent.click(screen.getByRole('radio', { name: 'Light mode' }))
    fireEvent.click(screen.getByRole('radio', { name: 'Dark mode' }))
    expect(onThemeChange).toHaveBeenNthCalledWith(1, 'light')
    expect(onThemeChange).toHaveBeenNthCalledWith(2, 'dark')
  })

  it('reflects light and dark preferences', () => {
    const { rerender } = render(
      <SettingsPage onThemeChange={() => undefined} preference="light" />,
    )
    expect(screen.getByRole('radio', { name: 'Light mode' })).toBeChecked()

    rerender(<SettingsPage onThemeChange={() => undefined} preference="dark" />)
    expect(screen.getByRole('radio', { name: 'Dark mode' })).toBeChecked()
  })
})
