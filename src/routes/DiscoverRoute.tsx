import { useEffect } from 'react'
import { useNavigate } from 'react-router'
import DiscoverPage from '@src/pages/DiscoverPage'

function DiscoverRoute() {
  const navigate = useNavigate()

  useEffect(() => {
    document.title = 'Discover — Flock'
    return () => {
      document.title = 'Flock'
    }
  }, [])
  return (
    <DiscoverPage
      onSelectFlock={(flockId) =>
        navigate(`/flocks/${encodeURIComponent(flockId)}`)
      }
      onSelectRunner={(userId) =>
        navigate(`/runners/${encodeURIComponent(userId)}`)
      }
    />
  )
}

export default DiscoverRoute
