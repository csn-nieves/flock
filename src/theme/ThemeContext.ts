import { createContext } from 'react'
import type { Theme, ThemePreference } from './types'

export type ThemeContextValue = {
  preference: ThemePreference
  resolvedTheme: Theme
  setPreference: (preference: ThemePreference) => void
}

export const ThemeContext = createContext<ThemeContextValue | null>(null)
