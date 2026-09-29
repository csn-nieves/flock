import { beforeEach, describe, expect, it, vi } from 'vitest'

const authMocks = vi.hoisted(() => ({
  signInWithOtp: vi.fn(),
  signOut: vi.fn(),
  verifyOtp: vi.fn(),
}))

vi.mock('./supabase', () => ({
  supabase: {
    auth: authMocks,
  },
}))

import {
  isValidEmailAddress,
  requestEmailOtp,
  signOut,
  verifyEmailOtp,
} from './auth'

describe('email OTP authentication', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('requests a six-digit code and allows new users to sign up', async () => {
    await requestEmailOtp('  runner@example.com  ')

    expect(authMocks.signInWithOtp).toHaveBeenCalledWith({
      email: 'runner@example.com',
      options: {
        shouldCreateUser: true,
      },
    })
  })

  it.each(['', 'runner', 'runner@', '@example.com', 'runner@example'])(
    'rejects invalid email address %j before requesting a code',
    (email) => {
      expect(() => requestEmailOtp(email)).toThrow(
        'Enter a valid email address.',
      )
      expect(authMocks.signInWithOtp).not.toHaveBeenCalled()
    },
  )

  it('exposes email validation for the sign-in form', () => {
    expect(isValidEmailAddress(' runner@example.com ')).toBe(true)
    expect(isValidEmailAddress('not-an-email')).toBe(false)
  })

  it('verifies the submitted code as an email OTP', async () => {
    await verifyEmailOtp({
      email: '  runner@example.com  ',
      token: '  123456  ',
    })

    expect(authMocks.verifyOtp).toHaveBeenCalledWith({
      email: 'runner@example.com',
      token: '123456',
      type: 'email',
    })
  })

  it('signs out the current session', async () => {
    await signOut()

    expect(authMocks.signOut).toHaveBeenCalledOnce()
  })
})
