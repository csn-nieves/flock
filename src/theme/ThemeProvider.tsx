import { useEffect, useState, type ReactNode } from 'react'

import { ThemeContext } from './ThemeContext'
import type { Theme, ThemePreference } from './types'

const themeStorageKey = 'flock.theme'

function getInitialPreference(): ThemePreference {
  const storedTheme = window.localStorage.getItem(themeStorageKey)
  if (
    storedTheme === 'light' ||
    storedTheme === 'dark' ||
    storedTheme === 'system'
  )
    return storedTheme
  return 'system'
}

function resolveTheme(preference: ThemePreference): Theme {
  if (preference !== 'system') return preference
  return typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreference] =
    useState<ThemePreference>(getInitialPreference)
  const [resolvedTheme, setResolvedTheme] = useState<Theme>(() =>
    resolveTheme(preference),
  )

  useEffect(() => {
    const updateTheme = () => setResolvedTheme(resolveTheme(preference))
    updateTheme()
    if (preference !== 'system' || typeof window.matchMedia !== 'function')
      return
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    media.addEventListener('change', updateTheme)
    return () => media.removeEventListener('change', updateTheme)
  }, [preference])

  useEffect(() => {
    document.documentElement.dataset.theme = resolvedTheme
    document.documentElement.style.colorScheme = resolvedTheme
    window.localStorage.setItem(themeStorageKey, preference)
  }, [preference, resolvedTheme])

  return (
    <ThemeContext.Provider value={{ preference, resolvedTheme, setPreference }}>
      {children}
    </ThemeContext.Provider>
  )
}
