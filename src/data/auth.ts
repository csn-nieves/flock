import type { AuthChangeEvent, Session } from '@supabase/supabase-js'

import { isValidEmailAddress } from '@src/auth/email'
import { supabase } from './supabase'

export type SocialAuthProvider = 'facebook' | 'google'

export function startOAuthSignIn(provider: SocialAuthProvider) {
  const redirectTo = new URL(
    '/auth/callback',
    window.location.origin,
  ).toString()

  return supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo,
    },
  })
}

export function exchangeOAuthCodeForSession(authorizationCode: string) {
  return supabase.auth.exchangeCodeForSession(authorizationCode)
}

export function requestEmailOtp(email: string) {
  const normalizedEmail = email.trim()

  if (!isValidEmailAddress(normalizedEmail)) {
    throw new Error('Enter a valid email address.')
  }

  return supabase.auth.signInWithOtp({
    email: normalizedEmail,
    options: {
      shouldCreateUser: true,
    },
  })
}

type VerifyEmailOtpInput = {
  email: string
  token: string
}

export function verifyEmailOtp({ email, token }: VerifyEmailOtpInput) {
  return supabase.auth.verifyOtp({
    email: email.trim(),
    token: token.trim(),
    type: 'email',
  })
}

export function signOut() {
  return supabase.auth.signOut()
}

export function getCurrentSession() {
  return supabase.auth.getSession()
}

type AuthSessionChangeListener = (
  event: AuthChangeEvent,
  session: Session | null,
) => void

export function subscribeToAuthChanges(listener: AuthSessionChangeListener) {
  const authStateChange = supabase.auth.onAuthStateChange(listener)
  const subscription = authStateChange.data.subscription

  return () => subscription.unsubscribe()
}
