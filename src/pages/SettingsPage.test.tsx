import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import SettingsPage from './SettingsPage'

describe('SettingsPage', () => {
  it('renders appearance settings copy', () => {
    render(<SettingsPage />)
    expect(screen.getByRole('heading', { name: 'Settings' })).toBeVisible()
    expect(screen.getByRole('heading', { name: 'Appearance' })).toBeVisible()
    expect(screen.getByText(/coming soon/)).toBeVisible()
  })
})
