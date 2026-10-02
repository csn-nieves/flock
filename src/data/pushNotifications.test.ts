import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  registerPushSubscription,
  serializePushSubscription,
  unregisterPushSubscription,
} from './pushNotifications'

const pushMocks = vi.hoisted(() => ({ rpc: vi.fn() }))

vi.mock('./supabase', () => ({
  supabase: { rpc: pushMocks.rpc },
}))

describe('push notification data', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    pushMocks.rpc.mockResolvedValue({ data: null, error: null })
  })

  it('serializes the browser subscription without losing either encryption key', () => {
    const subscription = {
      endpoint: 'https://push.example/device',
      expirationTime: null,
      toJSON: () => ({
        keys: { auth: 'auth-key', p256dh: 'p256dh-key' },
      }),
    } as unknown as PushSubscription

    expect(serializePushSubscription(subscription)).toEqual({
      authKey: 'auth-key',
      endpoint: 'https://push.example/device',
      expirationTime: null,
      p256dh: 'p256dh-key',
    })
  })

  it('registers the current device through the authenticated database function', async () => {
    await registerPushSubscription({
      authKey: 'auth-key',
      endpoint: 'https://push.example/device',
      expirationTime: null,
      p256dh: 'p256dh-key',
    })

    expect(pushMocks.rpc).toHaveBeenCalledWith('register_push_subscription', {
      subscription_auth_key: 'auth-key',
      subscription_endpoint: 'https://push.example/device',
      subscription_expiration_time: undefined,
      subscription_p256dh: 'p256dh-key',
    })
  })

  it('unregisters only the supplied browser endpoint', async () => {
    await unregisterPushSubscription('https://push.example/device')

    expect(pushMocks.rpc).toHaveBeenCalledWith('unregister_push_subscription', {
      subscription_endpoint: 'https://push.example/device',
    })
  })

  it('preserves server failures for the settings recovery state', async () => {
    const error = new Error('Connection unavailable')
    pushMocks.rpc.mockResolvedValue({ data: null, error })

    await expect(
      unregisterPushSubscription('https://push.example/device'),
    ).rejects.toBe(error)
  })
})
