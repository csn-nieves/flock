import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useSocialAuthController } from './useSocialAuthController'

const authMocks = vi.hoisted(() => ({
  startOAuthSignIn: vi.fn(),
}))

vi.mock('@src/data/auth', () => authMocks)

const successfulResponse = {
  data: {
    provider: 'google',
    url: 'https://accounts.example.com/oauth',
  },
  error: null,
}

describe('useSocialAuthController', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    authMocks.startOAuthSignIn.mockResolvedValue(successfulResponse)
  })

  it.each(['google', 'facebook'] as const)(
    'starts %s sign-in and keeps the redirect pending',
    async (provider) => {
      const { result } = renderHook(() => useSocialAuthController())

      await act(() => result.current.signIn(provider))

      expect(authMocks.startOAuthSignIn).toHaveBeenCalledWith(provider)
      expect(result.current.pendingProvider).toBe(provider)
      expect(result.current.error).toBeUndefined()
    },
  )

  it('blocks another provider while a redirect is starting', async () => {
    let finishRequest: () => void = () => undefined
    authMocks.startOAuthSignIn.mockImplementation(
      () =>
        new Promise((resolve) => {
          finishRequest = () => resolve(successfulResponse)
        }),
    )
    const { result } = renderHook(() => useSocialAuthController())

    let googleRequest: Promise<void>
    act(() => {
      googleRequest = result.current.signIn('google')
    })
    await act(() => result.current.signIn('facebook'))

    expect(authMocks.startOAuthSignIn).toHaveBeenCalledOnce()
    expect(authMocks.startOAuthSignIn).toHaveBeenCalledWith('google')
    expect(result.current.pendingProvider).toBe('google')

    await act(async () => {
      finishRequest()
      await googleRequest
    })
  })

  it('maps provider failures without exposing their raw message', async () => {
    authMocks.startOAuthSignIn.mockResolvedValue({
      data: { provider: 'facebook', url: null },
      error: { message: 'raw provider message' },
    })
    const { result } = renderHook(() => useSocialAuthController())

    await act(() => result.current.signIn('facebook'))

    expect(result.current.pendingProvider).toBeUndefined()
    expect(result.current.error).toBe(
      'Facebook sign-in could not start. Try again or use email.',
    )
    expect(result.current.error).not.toContain('raw provider')
  })

  it('maps connection failures and allows another attempt', async () => {
    authMocks.startOAuthSignIn.mockRejectedValueOnce(
      new TypeError('Failed to fetch'),
    )
    const { result } = renderHook(() => useSocialAuthController())

    await act(() => result.current.signIn('google'))

    expect(result.current.pendingProvider).toBeUndefined()
    expect(result.current.error).toBe(
      'We could not open Google sign-in. Check your connection and try again.',
    )

    await act(() => result.current.signIn('facebook'))
    expect(authMocks.startOAuthSignIn).toHaveBeenCalledTimes(2)
    expect(result.current.pendingProvider).toBe('facebook')
  })
})
