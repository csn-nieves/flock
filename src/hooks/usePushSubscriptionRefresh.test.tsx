import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { usePushSubscriptionRefresh } from './usePushSubscriptionRefresh'
import {
  getCurrentPushSubscription,
  getWebPushPublicKey,
  isPushNotificationSupported,
  needsIosHomeScreenInstall,
  registerPushSubscription,
  serializePushSubscription,
} from '@src/data/pushNotifications'

vi.mock('@src/hooks/useAuthSession', () => ({
  useAuthSession: () => ({ session: { user: { id: 'runner-id' } } }),
}))

vi.mock('@src/data/pushNotifications', () => ({
  getCurrentPushSubscription: vi.fn(),
  getWebPushPublicKey: vi.fn(),
  isPushNotificationSupported: vi.fn(),
  needsIosHomeScreenInstall: vi.fn(),
  registerPushSubscription: vi.fn(),
  serializePushSubscription: vi.fn(),
}))

const getSubscriptionMock = vi.mocked(getCurrentPushSubscription)
const getPublicKeyMock = vi.mocked(getWebPushPublicKey)
const isSupportedMock = vi.mocked(isPushNotificationSupported)
const needsInstallMock = vi.mocked(needsIosHomeScreenInstall)
const registerMock = vi.mocked(registerPushSubscription)
const serializeMock = vi.mocked(serializePushSubscription)

describe('usePushSubscriptionRefresh', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal('Notification', { permission: 'granted' })
    getPublicKeyMock.mockReturnValue('public-key')
    isSupportedMock.mockReturnValue(true)
    needsInstallMock.mockReturnValue(false)
    getSubscriptionMock.mockResolvedValue({} as PushSubscription)
    serializeMock.mockReturnValue({
      authKey: 'auth-key',
      endpoint: 'https://push.example/device',
      expirationTime: null,
      p256dh: 'p256dh-key',
    })
    registerMock.mockResolvedValue(undefined)
  })

  it('refreshes an existing granted subscription on app startup', async () => {
    renderHook(() => usePushSubscriptionRefresh())

    await waitFor(() => expect(registerMock).toHaveBeenCalledOnce())
    expect(serializeMock).toHaveBeenCalledOnce()
  })

  it('does not prompt or register when permission is not granted', async () => {
    vi.stubGlobal('Notification', { permission: 'default' })

    renderHook(() => usePushSubscriptionRefresh())
    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(getSubscriptionMock).not.toHaveBeenCalled()
    expect(registerMock).not.toHaveBeenCalled()
  })
})
