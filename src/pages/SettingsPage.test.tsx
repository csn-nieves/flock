import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import SettingsPage from './SettingsPage'

const defaultProps = {
  notificationPendingAction: undefined,
  notificationStatus: 'off' as const,
  onDisableNotifications: vi.fn(),
  onEnableNotifications: vi.fn(),
  onRetryNotifications: vi.fn(),
  onThemeChange: vi.fn(),
  preference: 'system' as const,
}

describe('SettingsPage', () => {
  it('renders all appearance choices and selects the current preference', () => {
    const onThemeChange = vi.fn()
    render(<SettingsPage {...defaultProps} onThemeChange={onThemeChange} />)
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
      <SettingsPage {...defaultProps} preference="light" />,
    )
    expect(screen.getByRole('radio', { name: 'Light mode' })).toBeChecked()

    rerender(<SettingsPage {...defaultProps} preference="dark" />)
    expect(screen.getByRole('radio', { name: 'Dark mode' })).toBeChecked()
  })

  it('lets a runner turn event invitation alerts on for this device', () => {
    const onEnableNotifications = vi.fn()
    render(
      <SettingsPage
        {...defaultProps}
        onEnableNotifications={onEnableNotifications}
      />,
    )

    expect(screen.getByText('Off for this device')).toBeVisible()
    fireEvent.click(
      screen.getByRole('button', { name: 'Turn on notifications' }),
    )
    expect(onEnableNotifications).toHaveBeenCalledOnce()
  })

  it('explains the iPhone and iPad Home Screen requirement', () => {
    render(
      <SettingsPage {...defaultProps} notificationStatus="needs-ios-install" />,
    )

    expect(
      screen.getByText('Add Flock to your Home Screen first'),
    ).toBeVisible()
    expect(screen.getByText(/Share → Add to Home Screen/)).toBeVisible()
    expect(
      screen.queryByRole('button', { name: 'Turn on notifications' }),
    ).not.toBeInTheDocument()
  })

  it('keeps notification recovery on the page after a sync error', () => {
    const onRetryNotifications = vi.fn()
    render(
      <SettingsPage
        {...defaultProps}
        notificationStatus="error"
        onRetryNotifications={onRetryNotifications}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(onRetryNotifications).toHaveBeenCalledOnce()
  })
})
