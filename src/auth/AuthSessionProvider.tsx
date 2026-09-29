import type { AuthError, Session } from '@supabase/supabase-js'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { AuthSessionContext } from './useAuthSession'
import { getCurrentSession, subscribeToAuthChanges } from '@src/data/auth'

type AuthSessionProviderProps = {
  children: ReactNode
}

export function AuthSessionProvider({ children }: AuthSessionProviderProps) {
  const [session, setSession] = useState<Session | null>(null)
  const [error, setError] = useState<AuthError | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isActive = true
    let hasReceivedAuthChange = false

    const sessionRequest = getCurrentSession()
    const unsubscribe = subscribeToAuthChanges((_event, nextSession) => {
      if (!isActive) {
        return
      }

      hasReceivedAuthChange = true
      setSession(nextSession)
      setError(null)
      setIsLoading(false)
    })

    void sessionRequest.then(({ data, error: sessionError }) => {
      if (!isActive || hasReceivedAuthChange) {
        return
      }

      setSession(data.session)
      setError(sessionError)
      setIsLoading(false)
    })

    return () => {
      isActive = false
      unsubscribe()
    }
  }, [])

  const value = useMemo(
    () => ({ error, isLoading, session }),
    [error, isLoading, session],
  )

  return (
    <AuthSessionContext.Provider value={value}>
      {children}
    </AuthSessionContext.Provider>
  )
}
