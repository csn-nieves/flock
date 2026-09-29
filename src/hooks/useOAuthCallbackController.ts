import { useEffect, useRef, useState } from 'react'

import { exchangeOAuthCodeForSession } from '@src/data/auth'

type OAuthCallbackInput = {
  authorizationCode: string | null
  hasProviderError: boolean
}

type OAuthCallbackState =
  | {
      status: 'error'
      error: string
    }
  | {
      status: 'loading' | 'success'
      error?: undefined
    }

function getInitialState({
  authorizationCode,
  hasProviderError,
}: OAuthCallbackInput): OAuthCallbackState {
  if (hasProviderError) {
    return {
      status: 'error',
      error:
        'Social sign-in was canceled or could not be completed. Return to sign in and try again.',
    }
  }

  if (!authorizationCode) {
    return {
      status: 'error',
      error:
        'This sign-in attempt is incomplete or has expired. Return to sign in and try again.',
    }
  }

  return { status: 'loading' }
}

function getExchangeError(error: unknown) {
  if (error instanceof TypeError) {
    return 'We could not finish sign-in because the connection was interrupted. Return to sign in and try again.'
  }

  return 'We could not finish social sign-in. Return to sign in and try again.'
}

export function useOAuthCallbackController(input: OAuthCallbackInput) {
  const requestRef = useRef<
    ReturnType<typeof exchangeOAuthCodeForSession> | undefined
  >(undefined)
  const [state, setState] = useState<OAuthCallbackState>(() =>
    getInitialState(input),
  )

  useEffect(() => {
    if (state.status !== 'loading' || !input.authorizationCode) {
      return
    }

    requestRef.current ??= exchangeOAuthCodeForSession(input.authorizationCode)
    let isActive = true

    void requestRef.current.then(
      ({ error }) => {
        if (!isActive) {
          return
        }

        if (error) {
          setState({ status: 'error', error: getExchangeError(error) })
          return
        }

        setState({ status: 'success' })
      },
      (error: unknown) => {
        if (isActive) {
          setState({ status: 'error', error: getExchangeError(error) })
        }
      },
    )

    return () => {
      isActive = false
    }
  }, [input.authorizationCode, state.status])

  return state
}
