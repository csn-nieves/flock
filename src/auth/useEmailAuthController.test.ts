import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useEmailAuthController } from './useEmailAuthController'

const authMocks = vi.hoisted(() => ({
  requestEmailOtp: vi.fn(),
  verifyEmailOtp: vi.fn(),
}))

vi.mock('@src/data/auth', () => authMocks)

const successfulResponse = {
  data: {},
  error: null,
}

describe('useEmailAuthController', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    authMocks.requestEmailOtp.mockResolvedValue(successfulResponse)
    authMocks.verifyEmailOtp.mockResolvedValue(successfulResponse)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('requests a code and advances to verification', async () => {
    const { result } = renderHook(() =>
      useEmailAuthController({ resendCooldownSeconds: 3 }),
    )

    await act(() => result.current.requestCode('  runner@example.com  '))

    expect(authMocks.requestEmailOtp).toHaveBeenCalledWith('runner@example.com')
    expect(result.current.email).toBe('runner@example.com')
    expect(result.current.step).toBe('verification')
    expect(result.current.resendAvailableInSeconds).toBe(3)
    expect(result.current.isRequesting).toBe(false)
  })

  it('keeps email entry active and maps request failures', async () => {
    authMocks.requestEmailOtp.mockResolvedValue({
      data: {},
      error: { code: 'over_email_send_rate_limit', status: 429 },
    })
    const { result } = renderHook(() => useEmailAuthController())

    await act(() => result.current.requestCode('runner@example.com'))

    expect(result.current.step).toBe('email')
    expect(result.current.requestError).toBe(
      'Too many codes requested. Wait a moment and try again.',
    )
  })

  it('verifies the code for the submitted email', async () => {
    const { result } = renderHook(() =>
      useEmailAuthController({ resendCooldownSeconds: 0 }),
    )
    await act(() => result.current.requestCode('runner@example.com'))

    await act(() => result.current.verifyCode('123456'))

    expect(authMocks.verifyEmailOtp).toHaveBeenCalledWith({
      email: 'runner@example.com',
      token: '123456',
    })
    expect(result.current.verificationError).toBeUndefined()
    expect(result.current.isVerifying).toBe(false)
  })

  it('maps rejected verification codes without exposing provider errors', async () => {
    authMocks.verifyEmailOtp.mockResolvedValue({
      data: {},
      error: { code: 'otp_expired', message: 'raw provider message' },
    })
    const { result } = renderHook(() =>
      useEmailAuthController({ resendCooldownSeconds: 0 }),
    )
    await act(() => result.current.requestCode('runner@example.com'))

    await act(() => result.current.verifyCode('123456'))

    expect(result.current.verificationError).toBe(
      'That code is invalid or has expired. Check the code and try again.',
    )
    expect(result.current.verificationError).not.toContain('raw provider')
  })

  it('resends to the stored email and restarts the cooldown', async () => {
    vi.useFakeTimers()
    const { result } = renderHook(() =>
      useEmailAuthController({ resendCooldownSeconds: 2 }),
    )
    await act(() => result.current.requestCode('runner@example.com'))

    await act(() => vi.advanceTimersByTimeAsync(1000))
    await act(() => vi.advanceTimersByTimeAsync(1000))
    expect(result.current.resendAvailableInSeconds).toBe(0)

    await act(() => result.current.resendCode())

    expect(authMocks.requestEmailOtp).toHaveBeenLastCalledWith(
      'runner@example.com',
    )
    expect(result.current.resendAvailableInSeconds).toBe(2)
    expect(result.current.isResending).toBe(false)
  })

  it('maps network failures while resending', async () => {
    const { result } = renderHook(() =>
      useEmailAuthController({ resendCooldownSeconds: 0 }),
    )
    await act(() => result.current.requestCode('runner@example.com'))
    authMocks.requestEmailOtp.mockRejectedValue(
      new TypeError('Failed to fetch'),
    )

    await act(() => result.current.resendCode())

    expect(result.current.resendError).toBe(
      'We could not send another code. Check your connection and try again.',
    )
  })

  it('returns to email entry and clears verification state', async () => {
    const { result } = renderHook(() =>
      useEmailAuthController({ resendCooldownSeconds: 30 }),
    )
    await act(() => result.current.requestCode('runner@example.com'))

    act(() => result.current.changeEmail())

    expect(result.current.step).toBe('email')
    expect(result.current.email).toBe('runner@example.com')
    expect(result.current.resendAvailableInSeconds).toBe(0)
    expect(result.current.verificationError).toBeUndefined()
    expect(result.current.resendError).toBeUndefined()
  })
})
