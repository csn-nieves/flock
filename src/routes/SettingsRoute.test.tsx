import { render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import SettingsRoute from './SettingsRoute'
import { ThemeProvider } from '@src/theme/ThemeProvider'

vi.mock('@src/hooks/usePushNotifications', () => ({
  usePushNotifications: () => ({
    disable: vi.fn(),
    enable: vi.fn(),
    pendingAction: undefined,
    retry: vi.fn(),
    status: 'off',
  }),
}))

describe('SettingsRoute', () => {
  it('sets the settings document title', () => {
    render(
      <ThemeProvider>
        <SettingsRoute />
      </ThemeProvider>,
    )
    expect(document.title).toBe('Settings — Flock')
  })
})
