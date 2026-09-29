import type { AuthError, Session } from '@supabase/supabase-js'
import { createContext, useContext } from 'react'

export type AuthSessionContextValue = {
  error: AuthError | null
  isLoading: boolean
  session: Session | null
}

export const AuthSessionContext = createContext<AuthSessionContextValue | null>(
  null,
)

export function useAuthSession() {
  const context = useContext(AuthSessionContext)

  if (!context) {
    throw new Error('useAuthSession must be used within AuthSessionProvider.')
  }

  return context
}
