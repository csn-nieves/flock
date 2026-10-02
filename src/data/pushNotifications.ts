import { supabase } from './supabase'

export type StoredPushSubscription = {
  authKey: string
  endpoint: string
  expirationTime: number | null
  p256dh: string
}

export function getWebPushPublicKey() {
  return import.meta.env.VITE_WEB_PUSH_PUBLIC_KEY?.trim() || undefined
}

export function isPushNotificationSupported() {
  return (
    'Notification' in window &&
    'PushManager' in window &&
    'serviceWorker' in navigator
  )
}

export function needsIosHomeScreenInstall() {
  const isIosLike =
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  const isStandalone =
    (typeof window.matchMedia === 'function' &&
      window.matchMedia('(display-mode: standalone)').matches) ||
    ('standalone' in navigator && navigator.standalone === true)

  return isIosLike && !isStandalone
}

export async function getCurrentPushSubscription() {
  const registration = await navigator.serviceWorker.ready
  return registration.pushManager.getSubscription()
}

export async function createPushSubscription(publicKey: string) {
  const registration = await navigator.serviceWorker.ready
  const existingSubscription = await registration.pushManager.getSubscription()

  return (
    existingSubscription ??
    registration.pushManager.subscribe({
      applicationServerKey: decodeBase64Url(publicKey),
      userVisibleOnly: true,
    })
  )
}

export function serializePushSubscription(
  subscription: PushSubscription,
): StoredPushSubscription {
  const serialized = subscription.toJSON()
  const authKey = serialized.keys?.auth
  const p256dh = serialized.keys?.p256dh

  if (!authKey || !p256dh) {
    throw new Error('The browser returned an incomplete push subscription.')
  }

  return {
    authKey,
    endpoint: subscription.endpoint,
    expirationTime: subscription.expirationTime,
    p256dh,
  }
}

export async function registerPushSubscription(
  subscription: StoredPushSubscription,
) {
  const { error } = await supabase.rpc('register_push_subscription', {
    subscription_auth_key: subscription.authKey,
    subscription_endpoint: subscription.endpoint,
    subscription_expiration_time: subscription.expirationTime ?? undefined,
    subscription_p256dh: subscription.p256dh,
  })

  if (error) throw error
}

export async function unregisterPushSubscription(endpoint: string) {
  const { error } = await supabase.rpc('unregister_push_subscription', {
    subscription_endpoint: endpoint,
  })

  if (error) throw error
}

function decodeBase64Url(value: string) {
  const padding = '='.repeat((4 - (value.length % 4)) % 4)
  const base64 = (value + padding).replace(/-/g, '+').replace(/_/g, '/')
  const decoded = window.atob(base64)
  return Uint8Array.from(decoded, (character) => character.charCodeAt(0))
}
