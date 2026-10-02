import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'

import { ThemeProvider } from './ThemeProvider'
import { useTheme } from './useTheme'

describe('ThemeProvider', () => {
  beforeEach(() => {
    window.localStorage.clear()
    document.documentElement.removeAttribute('data-theme')
    document.documentElement.style.colorScheme = ''
  })

  it('persists and applies a selected dark theme', () => {
    const { result } = renderHook(() => useTheme(), { wrapper: ThemeProvider })

    act(() => result.current.setPreference('dark'))

    expect(result.current.resolvedTheme).toBe('dark')
    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(document.documentElement.style.colorScheme).toBe('dark')
    expect(window.localStorage.getItem('flock.theme')).toBe('dark')
  })
})
