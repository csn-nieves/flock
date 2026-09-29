import { useEffect, useRef, useState } from 'react'

import { startOAuthSignIn, type SocialAuthProvider } from '@src/data/auth'

function getProviderLabel(provider: SocialAuthProvider) {
  return provider === 'facebook' ? 'Facebook' : 'Google'
}

function getSocialAuthError(provider: SocialAuthProvider, error: unknown) {
  const providerLabel = getProviderLabel(provider)

  if (error instanceof TypeError) {
    return `We could not open ${providerLabel} sign-in. Check your connection and try again.`
  }

  return `${providerLabel} sign-in could not start. Try again or use email.`
}

export function useSocialAuthController() {
  const isMountedRef = useRef(true)
  const isRequestActiveRef = useRef(false)
  const [error, setError] = useState<string>()
  const [pendingProvider, setPendingProvider] = useState<SocialAuthProvider>()

  useEffect(() => {
    isMountedRef.current = true

    return () => {
      isMountedRef.current = false
    }
  }, [])

  async function signIn(provider: SocialAuthProvider) {
    if (isRequestActiveRef.current) {
      return
    }

    isRequestActiveRef.current = true
    setError(undefined)
    setPendingProvider(provider)

    try {
      const response = await startOAuthSignIn(provider)

      if (!isMountedRef.current || !response.error) {
        return
      }

      isRequestActiveRef.current = false
      setPendingProvider(undefined)
      setError(getSocialAuthError(provider, response.error))
    } catch (error) {
      if (!isMountedRef.current) {
        return
      }

      isRequestActiveRef.current = false
      setPendingProvider(undefined)
      setError(getSocialAuthError(provider, error))
    }
  }

  return {
    error,
    pendingProvider,
    signIn,
  }
}
