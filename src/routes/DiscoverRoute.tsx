import { useEffect } from 'react'
import DiscoverPage from '@src/pages/DiscoverPage'

function DiscoverRoute() {
  useEffect(() => {
    document.title = 'Discover — Flock'
    return () => {
      document.title = 'Flock'
    }
  }, [])
  return <DiscoverPage />
}

export default DiscoverRoute
