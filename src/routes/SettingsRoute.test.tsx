import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import SettingsRoute from './SettingsRoute'

describe('SettingsRoute', () => {
  it('sets the settings document title', () => {
    render(<SettingsRoute />)
    expect(document.title).toBe('Settings — Flock')
  })
})
