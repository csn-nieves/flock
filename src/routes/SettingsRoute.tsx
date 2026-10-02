import { useEffect } from 'react'
import { useNavigate } from 'react-router'

import SettingsPage from '@src/pages/SettingsPage'

function SettingsRoute() {
  const navigate = useNavigate()

  useEffect(() => {
    document.title = 'Settings — Flock'
    return () => {
      document.title = 'Flock'
    }
  }, [])

  return <SettingsPage onBack={() => navigate('/flocks', { replace: true })} />
}

export default SettingsRoute
