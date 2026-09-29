import { supabase } from './supabase'

const EMAIL_ADDRESS_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function isValidEmailAddress(email: string) {
  return EMAIL_ADDRESS_PATTERN.test(email.trim())
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
