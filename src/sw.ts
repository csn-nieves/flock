/// <reference lib="webworker" />

import {
  cleanupOutdatedCaches,
  createHandlerBoundToURL,
  precacheAndRoute,
} from 'workbox-precaching'
import { NavigationRoute, registerRoute } from 'workbox-routing'

declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<{ revision: string | null; url: string }>
}

type PushPayload = {
  body?: string
  tag?: string
  title?: string
  url?: string
}

cleanupOutdatedCaches()
precacheAndRoute(self.__WB_MANIFEST)
registerRoute(new NavigationRoute(createHandlerBoundToURL('/index.html')))

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    void self.skipWaiting()
  }
})

self.addEventListener('push', (event) => {
  const payload = readPushPayload(event)
  const url = getSafeNotificationUrl(payload.url)
  event.waitUntil(
    self.registration.showNotification(
      payload.title?.trim() || 'New Flock alert',
      {
        badge: '/icons/pwa-192x192.png',
        body: payload.body?.trim() || 'Open Flock to see what changed.',
        data: { url },
        icon: '/icons/pwa-192x192.png',
        tag: payload.tag?.trim() || 'flock-alert',
      },
    ),
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = getSafeNotificationUrl(event.notification.data?.url)
  const absoluteUrl = new URL(url, self.location.origin).href

  event.waitUntil(
    (async () => {
      const clients = await self.clients.matchAll({
        includeUncontrolled: true,
        type: 'window',
      })
      const existingClient = clients.find((client) => {
        return new URL(client.url).origin === self.location.origin
      })

      if (existingClient) {
        try {
          await existingClient.focus()
          try {
            await existingClient.navigate(url)
            return
          } catch {
            // Some installed-PWA clients expose a window but reject navigate.
          }
        } catch {
          // A background PWA client may reject focus; open a fresh window.
        }
      }

      await self.clients.openWindow(absoluteUrl)
    })(),
  )
})

function getSafeNotificationUrl(value: unknown) {
  if (typeof value !== 'string') return '/events'

  const target = new URL(value, self.location.origin)
  if (target.origin !== self.location.origin) {
    return '/events'
  }

  return `${target.pathname}${target.search}${target.hash}`
}

function readPushPayload(event: PushEvent): PushPayload {
  try {
    return (event.data?.json() as PushPayload) ?? {}
  } catch {
    return {}
  }
}
