import { renderHook, waitFor } from '@testing-library/react'
import { StrictMode, type ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useOAuthCallbackController } from './useOAuthCallbackController'

const authMocks = vi.hoisted(() => ({
  exchangeOAuthCodeForSession: vi.fn(),
}))

vi.mock('@src/data/auth', () => authMocks)

const successfulResponse = {
  data: { session: null, user: null },
  error: null,
}

describe('useOAuthCallbackController', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    authMocks.exchangeOAuthCodeForSession.mockResolvedValue(successfulResponse)
  })

  it('exchanges the authorization code and reports success', async () => {
    const { result } = renderHook(() =>
      useOAuthCallbackController({
        authorizationCode: 'callback-code',
        hasProviderError: false,
      }),
    )

    expect(result.current.status).toBe('loading')

    await waitFor(() => {
      expect(result.current.status).toBe('success')
    })
    expect(authMocks.exchangeOAuthCodeForSession).toHaveBeenCalledWith(
      'callback-code',
    )
  })

  it('exchanges a single-use code only once in Strict Mode', async () => {
    function StrictWrapper({ children }: { children: ReactNode }) {
      return <StrictMode>{children}</StrictMode>
    }

    const { result } = renderHook(
      () =>
        useOAuthCallbackController({
          authorizationCode: 'single-use-code',
          hasProviderError: false,
        }),
      { wrapper: StrictWrapper },
    )

    await waitFor(() => {
      expect(result.current.status).toBe('success')
    })
    expect(authMocks.exchangeOAuthCodeForSession).toHaveBeenCalledOnce()
  })

  it('handles provider cancellation without attempting an exchange', () => {
    const { result } = renderHook(() =>
      useOAuthCallbackController({
        authorizationCode: null,
        hasProviderError: true,
      }),
    )

    expect(result.current).toEqual({
      status: 'error',
      error:
        'Social sign-in was canceled or could not be completed. Return to sign in and try again.',
    })
    expect(authMocks.exchangeOAuthCodeForSession).not.toHaveBeenCalled()
  })

  it('handles a missing authorization code without starting an exchange', () => {
    const { result } = renderHook(() =>
      useOAuthCallbackController({
        authorizationCode: null,
        hasProviderError: false,
      }),
    )

    expect(result.current).toEqual({
      status: 'error',
      error:
        'This sign-in attempt is incomplete or has expired. Return to sign in and try again.',
    })
    expect(authMocks.exchangeOAuthCodeForSession).not.toHaveBeenCalled()
  })

  it('maps provider failures without exposing raw details', async () => {
    authMocks.exchangeOAuthCodeForSession.mockResolvedValue({
      data: { session: null, user: null },
      error: { message: 'raw provider message' },
    })
    const { result } = renderHook(() =>
      useOAuthCallbackController({
        authorizationCode: 'failed-code',
        hasProviderError: false,
      }),
    )

    await waitFor(() => {
      expect(result.current.status).toBe('error')
    })
    expect(result.current.error).toBe(
      'We could not finish social sign-in. Return to sign in and try again.',
    )
    expect(result.current.error).not.toContain('raw provider')
  })

  it('maps connection failures to recoverable guidance', async () => {
    authMocks.exchangeOAuthCodeForSession.mockRejectedValue(
      new TypeError('Failed to fetch'),
    )
    const { result } = renderHook(() =>
      useOAuthCallbackController({
        authorizationCode: 'offline-code',
        hasProviderError: false,
      }),
    )

    await waitFor(() => {
      expect(result.current.status).toBe('error')
    })
    expect(result.current.error).toBe(
      'We could not finish sign-in because the connection was interrupted. Return to sign in and try again.',
    )
  })
})
