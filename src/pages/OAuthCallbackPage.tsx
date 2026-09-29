import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router'

import { consumeAuthDestination } from '@src/auth/destination'
import AuthPageLayout from '@src/components/AuthPageLayout'
import { useOAuthCallbackController } from '@src/hooks/useOAuthCallbackController'
import Button from '@src/primitives/Button'
import PendingIndicator from '@src/primitives/PendingIndicator'

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

function OAuthCallbackPage() {
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
    return (
      <AuthPageLayout
        description="Securely connecting your account…"
        heading="Finishing sign-in"
        isStatus
      >
        <PendingIndicator className="mt-1 size-5" />
      </AuthPageLayout>
    )
  }

  if (status === 'success') {
    return (
      <AuthPageLayout
        description="Taking you back to where you left off…"
        heading="Sign-in complete"
        isStatus
      />
    )
  }

  return (
    <AuthPageLayout
      description="Your account was not connected."
      heading="Sign-in did not finish"
    >
      <p
        className="mt-0 mb-6 rounded-md border border-accent bg-surface-subtle px-4 py-3 text-sm leading-5 text-text"
        role="alert"
      >
        {error}
      </p>
      <Button
        className="w-full"
        onClick={() => navigate('/sign-in', { replace: true })}
      >
        Return to sign in
      </Button>
    </AuthPageLayout>
  )
}

export default OAuthCallbackPage
