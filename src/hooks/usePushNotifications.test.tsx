import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  createPushSubscription,
  getCurrentPushSubscription,
  getWebPushPublicKey,
  isPushNotificationSupported,
  needsIosHomeScreenInstall,
  registerPushSubscription,
  serializePushSubscription,
  unregisterPushSubscription,
} from '@src/data/pushNotifications'
import { usePushNotifications } from './usePushNotifications'

vi.mock('@src/data/pushNotifications', () => ({
  createPushSubscription: vi.fn(),
  getCurrentPushSubscription: vi.fn(),
  getWebPushPublicKey: vi.fn(),
  isPushNotificationSupported: vi.fn(),
  needsIosHomeScreenInstall: vi.fn(),
  registerPushSubscription: vi.fn(),
  serializePushSubscription: vi.fn(),
  unregisterPushSubscription: vi.fn(),
}))

const createSubscriptionMock = vi.mocked(createPushSubscription)
const getSubscriptionMock = vi.mocked(getCurrentPushSubscription)
const getPublicKeyMock = vi.mocked(getWebPushPublicKey)
const isSupportedMock = vi.mocked(isPushNotificationSupported)
const needsInstallMock = vi.mocked(needsIosHomeScreenInstall)
const registerMock = vi.mocked(registerPushSubscription)
const serializeMock = vi.mocked(serializePushSubscription)
const unregisterMock = vi.mocked(unregisterPushSubscription)

describe('usePushNotifications', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal('Notification', {
      permission: 'default',
      requestPermission: vi.fn(),
    })
    getPublicKeyMock.mockReturnValue('public-key')
    isSupportedMock.mockReturnValue(true)
    needsInstallMock.mockReturnValue(false)
    getSubscriptionMock.mockResolvedValue(null)
    registerMock.mockResolvedValue(undefined)
    unregisterMock.mockResolvedValue(undefined)
  })

  it('does not request browser permission while inspecting settings', async () => {
    const { result } = renderHook(() => usePushNotifications())

    await waitFor(() => expect(result.current.status).toBe('off'))
    expect(Notification.requestPermission).not.toHaveBeenCalled()
  })

  it('requests permission only after the runner turns notifications on', async () => {
    const requestPermission = vi.fn().mockResolvedValue('granted')
    vi.stubGlobal('Notification', {
      permission: 'default',
      requestPermission,
    })
    const subscription = { endpoint: 'https://push.example/device' }
    createSubscriptionMock.mockResolvedValue(subscription as PushSubscription)
    serializeMock.mockReturnValue({
      authKey: 'auth-key',
      endpoint: 'https://push.example/device',
      expirationTime: null,
      p256dh: 'p256dh-key',
    })
    const { result } = renderHook(() => usePushNotifications())
    await waitFor(() => expect(result.current.status).toBe('off'))

    await act(() => result.current.enable())

    expect(requestPermission).toHaveBeenCalledOnce()
    expect(createSubscriptionMock).toHaveBeenCalledWith('public-key')
    expect(registerMock).toHaveBeenCalledOnce()
    expect(result.current.status).toBe('on')
  })

  it('explains when iOS requires a Home Screen installation', async () => {
    needsInstallMock.mockReturnValue(true)
    const { result } = renderHook(() => usePushNotifications())

    await waitFor(() => expect(result.current.status).toBe('needs-ios-install'))
    expect(isSupportedMock).not.toHaveBeenCalled()
  })

  it('removes the server record before unsubscribing this browser', async () => {
    const unsubscribe = vi.fn().mockResolvedValue(true)
    const subscription = {
      endpoint: 'https://push.example/device',
      unsubscribe,
    } as unknown as PushSubscription
    vi.stubGlobal('Notification', {
      permission: 'granted',
      requestPermission: vi.fn(),
    })
    getSubscriptionMock.mockResolvedValue(subscription)
    serializeMock.mockReturnValue({
      authKey: 'auth-key',
      endpoint: 'https://push.example/device',
      expirationTime: null,
      p256dh: 'p256dh-key',
    })
    const { result } = renderHook(() => usePushNotifications())
    await waitFor(() => expect(result.current.status).toBe('on'))

    await act(() => result.current.disable())

    expect(unregisterMock).toHaveBeenCalledWith('https://push.example/device')
    expect(unsubscribe).toHaveBeenCalledOnce()
    expect(result.current.status).toBe('off')
  })
})
