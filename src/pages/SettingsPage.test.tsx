import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import SettingsPage from './SettingsPage'

describe('SettingsPage', () => {
  it('renders appearance settings copy', () => {
    render(<SettingsPage onThemeChange={() => undefined} preference="system" />)
    expect(screen.getByRole('heading', { name: 'Settings' })).toBeVisible()
    expect(screen.getByRole('heading', { name: 'Appearance' })).toBeVisible()
    expect(
      screen.getByRole('radio', { name: 'Use device setting' }),
    ).toBeChecked()
  })
})
