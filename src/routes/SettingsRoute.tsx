import { useEffect } from 'react'

import SettingsPage from '@src/pages/SettingsPage'
import { useTheme } from '@src/theme/useTheme'

function SettingsRoute() {
  const theme = useTheme()
  useEffect(() => {
    document.title = 'Settings — Flock'
    return () => {
      document.title = 'Flock'
    }
  }, [])

  return (
    <SettingsPage
      onThemeChange={theme.setPreference}
      preference={theme.preference}
    />
  )
}

export default SettingsRoute
