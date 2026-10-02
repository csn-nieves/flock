import { useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router'

import AuthPageLayout from '@src/components/AuthPageLayout'
import AppShell from '@src/components/AppShell'
import { useAuthSession } from '@src/hooks/useAuthSession'
import { preserveAuthDestination } from './destination'

function ProtectedRoute() {
  const { isLoading, session } = useAuthSession()
  const hasRedirectedRef = useRef(false)
  const location = useLocation()
  const navigate = useNavigate()
  const destination = `${location.pathname}${location.search}${location.hash}`

  useEffect(() => {
    if (session) {
      return
    }

    document.title = isLoading ? 'Loading… — Flock' : 'Sign in — Flock'

    return () => {
      document.title = 'Flock'
    }
  }, [isLoading, session])

  useEffect(() => {
    if (isLoading || session || hasRedirectedRef.current) {
      return
    }

    hasRedirectedRef.current = true
    preserveAuthDestination(destination)
    navigate('/sign-in', { replace: true })
  }, [destination, isLoading, navigate, session])

  if (isLoading) {
    return (
      <AuthPageLayout
        description="Checking your session…"
        heading="Getting Flock ready"
        isStatus
      />
    )
  }

  if (!session) {
    return (
      <AuthPageLayout
        description="Taking you to sign in…"
        heading="Sign in required"
        isStatus
      />
    )
  }

  return <AppShell />
}

export default ProtectedRoute
