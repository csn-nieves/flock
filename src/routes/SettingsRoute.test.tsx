import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import SettingsRoute from './SettingsRoute'
import { ThemeProvider } from '@src/theme/ThemeProvider'

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
