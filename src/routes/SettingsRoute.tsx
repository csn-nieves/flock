import { useEffect } from 'react'

import SettingsPage from '@src/pages/SettingsPage'

function SettingsRoute() {
  useEffect(() => {
    document.title = 'Settings — Flock'
    return () => {
      document.title = 'Flock'
    }
  }, [])

  return <SettingsPage />
}

export default SettingsRoute
