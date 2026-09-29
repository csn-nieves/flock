import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  getCurrentSession,
  requestEmailOtp,
  signOut,
  subscribeToAuthChanges,
  verifyEmailOtp,
} from './auth'

const authMocks = vi.hoisted(() => {
  const unsubscribe = vi.fn()

  return {
    getSession: vi.fn(),
    onAuthStateChange: vi.fn(() => ({
      data: {
        subscription: {
          unsubscribe,
        },
      },
    })),
    signInWithOtp: vi.fn(),
    signOut: vi.fn(),
    unsubscribe,
    verifyOtp: vi.fn(),
  }
})

vi.mock('./supabase', () => ({
  supabase: {
    auth: authMocks,
  },
}))

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

  it('reads the current persisted session', async () => {
    const response = {
      data: {
        session: null,
      },
      error: null,
    }
    authMocks.getSession.mockResolvedValue(response)

    await expect(getCurrentSession()).resolves.toBe(response)
    expect(authMocks.getSession).toHaveBeenCalledOnce()
  })

  it('subscribes to auth changes and exposes cleanup', () => {
    const listener = vi.fn()

    const unsubscribe = subscribeToAuthChanges(listener)

    expect(authMocks.onAuthStateChange).toHaveBeenCalledWith(listener)

    unsubscribe()

    expect(authMocks.unsubscribe).toHaveBeenCalledOnce()
  })
})
