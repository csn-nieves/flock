import { useCallback, useEffect, useState } from 'react'

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
import type {
  PushNotificationAction,
  PushNotificationStatus,
} from '@src/types/pushNotifications'

export function usePushNotifications() {
  const [status, setStatus] = useState<PushNotificationStatus>('checking')
  const [pendingAction, setPendingAction] = useState<PushNotificationAction>()

  const inspectSubscription = useCallback(async () => {
    try {
      if (needsIosHomeScreenInstall()) {
        setStatus('needs-ios-install')
        return
      }

      if (!isPushNotificationSupported()) {
        setStatus('unsupported')
        return
      }

      if (!getWebPushPublicKey()) {
        setStatus('not-configured')
        return
      }

      if (Notification.permission === 'denied') {
        setStatus('denied')
        return
      }

      if (Notification.permission !== 'granted') {
        setStatus('off')
        return
      }

      const subscription = await getCurrentPushSubscription()
      if (!subscription) {
        setStatus('off')
        return
      }

      await registerPushSubscription(serializePushSubscription(subscription))
      setStatus('on')
    } catch {
      setStatus('error')
    } finally {
      setPendingAction(undefined)
    }
  }, [])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void inspectSubscription()
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [inspectSubscription])

  const retry = useCallback(async () => {
    setPendingAction('retrying')
    await inspectSubscription()
  }, [inspectSubscription])

  const enable = useCallback(async () => {
    const publicKey = getWebPushPublicKey()
    if (!publicKey || !isPushNotificationSupported()) {
      await inspectSubscription()
      return
    }

    setPendingAction('enabling')
    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        setStatus(permission === 'denied' ? 'denied' : 'off')
        return
      }

      const subscription = await createPushSubscription(publicKey)
      await registerPushSubscription(serializePushSubscription(subscription))
      setStatus('on')
    } catch {
      setStatus('error')
    } finally {
      setPendingAction(undefined)
    }
  }, [inspectSubscription])

  const disable = useCallback(async () => {
    setPendingAction('disabling')
    try {
      const subscription = await getCurrentPushSubscription()
      if (subscription) {
        await unregisterPushSubscription(subscription.endpoint)
        const didUnsubscribe = await subscription.unsubscribe()
        if (!didUnsubscribe) {
          throw new Error('The browser did not remove the push subscription.')
        }
      }
      setStatus('off')
    } catch {
      setStatus('error')
    } finally {
      setPendingAction(undefined)
    }
  }, [])

  return {
    disable,
    enable,
    pendingAction,
    retry,
    status,
  }
}
