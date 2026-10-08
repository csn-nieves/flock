import { useEffect } from 'react'

import { useAuthSession } from '@src/hooks/useAuthSession'
import {
  getCurrentPushSubscription,
  getWebPushPublicKey,
  isPushNotificationSupported,
  needsIosHomeScreenInstall,
  registerPushSubscription,
  serializePushSubscription,
} from '@src/data/pushNotifications'

/**
 * Re-registers an existing browser subscription when an authenticated app
 * session starts or returns to the foreground. This repairs stale server
 * records after a PWA reinstall or browser subscription rotation without
 * prompting the runner for permission.
 */
export function usePushSubscriptionRefresh() {
  const { session } = useAuthSession()
  const userId = session?.user.id

  useEffect(() => {
    if (!userId) return

    let isCancelled = false

    const refresh = async () => {
      if (
        isCancelled ||
        needsIosHomeScreenInstall() ||
        !isPushNotificationSupported() ||
        !getWebPushPublicKey() ||
        typeof Notification === 'undefined' ||
        Notification.permission !== 'granted'
      ) {
        return
      }

      try {
        const subscription = await getCurrentPushSubscription()
        if (isCancelled || !subscription) return

        await registerPushSubscription(serializePushSubscription(subscription))
      } catch {
        // Settings remains the explicit retry surface when silent refresh fails.
      }
    }

    void refresh()

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') void refresh()
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      isCancelled = true
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [userId])
}
