import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router'

import { consumeAuthDestination } from '@src/auth/destination'
import { useOAuthCallbackController } from '@src/hooks/useOAuthCallbackController'
import {
  OAuthCallbackErrorPage,
  OAuthCallbackLoadingPage,
  OAuthCallbackSuccessPage,
} from '@src/pages/OAuthCallbackPage'

function readCallbackInput(search: string, hash: string) {
  const searchParameters = new URLSearchParams(search)
  const hashParameters = new URLSearchParams(
    hash.startsWith('#') ? hash.slice(1) : hash,
  )

  return {
    authorizationCode:
      searchParameters.get('code') ?? hashParameters.get('code'),
    hasProviderError:
      searchParameters.has('error') || hashParameters.has('error'),
  }
}

function OAuthCallbackRoute() {
  const location = useLocation()
  const navigate = useNavigate()
  const hasRedirectedRef = useRef(false)
  const [callbackInput] = useState(() =>
    readCallbackInput(location.search, location.hash),
  )
  const { error, status } = useOAuthCallbackController(callbackInput)

  let title = 'Finishing sign-in — Flock'

  if (status === 'error') {
    title = 'Sign-in problem — Flock'
  } else if (status === 'success') {
    title = 'Signed in — Flock'
  }

  useEffect(() => {
    document.title = title

    return () => {
      document.title = 'Flock'
    }
  }, [title])

  useEffect(() => {
    if (location.search || location.hash) {
      navigate('/auth/callback', { replace: true })
    }
  }, [location.hash, location.search, navigate])

  useEffect(() => {
    if (status !== 'success' || hasRedirectedRef.current) {
      return
    }

    hasRedirectedRef.current = true
    navigate(consumeAuthDestination(), { replace: true })
  }, [navigate, status])

  if (status === 'loading') {
    return <OAuthCallbackLoadingPage />
  }

  if (status === 'success') {
    return <OAuthCallbackSuccessPage />
  }

  return (
    <OAuthCallbackErrorPage
      error={error}
      onReturnToSignIn={() => navigate('/sign-in', { replace: true })}
    />
  )
}

export default OAuthCallbackRoute
