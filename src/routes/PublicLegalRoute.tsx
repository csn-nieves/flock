import { useEffect } from 'react'
import { useLocation } from 'react-router'

import PublicLegalPage from '@src/pages/PublicLegalPage'

function PublicLegalRoute() {
  const location = useLocation()
  const isPrivacyPage = location.pathname === '/privacy'

  useEffect(() => {
    document.title = isPrivacyPage
      ? 'Privacy — Flock'
      : 'Request data deletion — Flock'

    return () => {
      document.title = 'Flock'
    }
  }, [isPrivacyPage])

  return <PublicLegalPage kind={isPrivacyPage ? 'privacy' : 'data-deletion'} />
}

export default PublicLegalRoute
